import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv",
  ogv: "video/ogg",
  ts: "video/mp2t",
  m4v: "video/x-m4v",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  mts: "video/mp2t",
  mxf: "application/mxf",
  gif: "image/gif",
  mp3: "audio/mpeg",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  opus: "audio/opus",
  flac: "audio/flac",
  wma: "audio/x-ms-wma",
};

// Audio-only formats that use /audio/encode robot
const AUDIO_FORMATS = new Set(["mp3", "aac", "wav", "ogg", "m4a", "opus", "flac", "wma"]);

// Format → Transloadit ffmpeg params defaults
const FORMAT_DEFAULTS: Record<string, Record<string, string>> = {
  webm:  { vcodec: "libvpx-vp9",   acodec: "libopus" },
  ogv:   { vcodec: "libtheora",     acodec: "libvorbis" },
  ogg:   { vcodec: "libtheora",     acodec: "libvorbis" },
  avi:   { vcodec: "libxvid",       acodec: "libmp3lame" },
  flv:   { vcodec: "libx264",       acodec: "aac" },
  wmv:   { vcodec: "wmv2",          acodec: "wmav2" },
  wma:   { acodec: "wmav2" },
  mp3:   { acodec: "libmp3lame" },
  aac:   { acodec: "aac" },
  opus:  { acodec: "libopus" },
  flac:  { acodec: "flac" },
  wav:   { acodec: "pcm_s16le" },
  m4a:   { acodec: "aac" },
  ogg_audio: { acodec: "libvorbis" },
};

function buildTransloaditParams(
  outputFormat: string,
  settings: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const fmt = outputFormat.toLowerCase();
  const isAudio = AUDIO_FORMATS.has(fmt);
  const robot = isAudio ? "/audio/encode" : "/video/encode";

  // Build ffmpeg sub-params
  const ffmpeg: Record<string, unknown> = {};
  const stepParams: Record<string, unknown> = {};

  // Format-specific codec defaults
  const defaults = FORMAT_DEFAULTS[fmt] ?? {};
  if (defaults.vcodec && !isAudio) ffmpeg["vcodec"] = defaults.vcodec;
  if (defaults.acodec) ffmpeg["acodec"] = defaults.acodec;

  // For standard formats, let Transloadit pick good defaults
  if (fmt === "mp4" || fmt === "m4v") {
    ffmpeg["vcodec"] = "libx264";
    ffmpeg["acodec"] = "aac";
  }
  if (fmt === "mov") {
    ffmpeg["vcodec"] = "libx264";
    ffmpeg["acodec"] = "aac";
  }
  if (fmt === "mkv") {
    ffmpeg["vcodec"] = "libx264";
    ffmpeg["acodec"] = "aac";
  }

  // GIF: use palette for quality
  if (fmt === "gif") {
    stepParams["animated"] = true;
    ffmpeg["vf"] = "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
    delete ffmpeg["vcodec"];
    delete ffmpeg["acodec"];
  }

  // Apply user settings
  if (settings && typeof settings === "object") {
    const s = settings as Record<string, unknown>;

    // Video codec override
    if (s.videoCodec && typeof s.videoCodec === "string" && s.videoCodec !== "auto" && !isAudio) {
      ffmpeg["vcodec"] = s.videoCodec;
    }

    // Audio codec override
    if (s.audioCodec && typeof s.audioCodec === "string" && s.audioCodec !== "auto") {
      ffmpeg["acodec"] = s.audioCodec;
    }

    // Resolution
    if (s.resolution && typeof s.resolution === "string" && s.resolution !== "original") {
      if (s.resolution === "custom") {
        if (s.customWidth) stepParams["width"] = Number(s.customWidth);
        if (s.customHeight) stepParams["height"] = Number(s.customHeight);
      } else {
        const match = s.resolution.match(/(\d+)x(\d+)/);
        if (match) {
          stepParams["width"] = Number(match[1]);
          stepParams["height"] = Number(match[2]);
        }
      }
    }

    // Frame rate
    if (s.frameRate && typeof s.frameRate === "string" && s.frameRate !== "original") {
      ffmpeg["r"] = s.frameRate;
    }

    // Rotation (using transpose filter)
    const vfFilters: string[] = fmt === "gif" ? [] : [];
    if (s.rotate && typeof s.rotate === "string" && s.rotate !== "0" && fmt !== "gif") {
      const rotateMap: Record<string, string> = {
        "90": "transpose=1",
        "180": "transpose=2,transpose=2",
        "270": "transpose=2",
      };
      if (rotateMap[s.rotate]) vfFilters.push(rotateMap[s.rotate]);
    }

    // Flip
    if (s.flip && typeof s.flip === "string" && s.flip !== "none" && fmt !== "gif") {
      vfFilters.push(s.flip); // "hflip" or "vflip"
    }

    if (vfFilters.length > 0) {
      ffmpeg["vf"] = vfFilters.join(",");
    }

    // Trim
    if (s.trimStart && typeof s.trimStart === "string" && s.trimStart !== "0") {
      ffmpeg["ss"] = s.trimStart;
    }
    if (s.trimEnd && typeof s.trimEnd === "string" && s.trimEnd !== "") {
      // Transloadit uses "t" for duration, but we get end time — use "to" instead
      ffmpeg["to"] = s.trimEnd;
    }

    // Bitrates
    if (s.videoBitrate && typeof s.videoBitrate === "string" && s.videoBitrate !== "" && !isAudio) {
      ffmpeg["b:v"] = s.videoBitrate;
    }
    if (s.audioBitrate && typeof s.audioBitrate === "string" && s.audioBitrate !== "") {
      ffmpeg["b:a"] = s.audioBitrate;
    }

    // Remove audio
    if (s.removeAudio === true && !isAudio) {
      ffmpeg["an"] = 1;
      delete ffmpeg["acodec"];
    }

    // Volume
    if (s.volume && typeof s.volume === "number" && s.volume !== 100 && !isAudio) {
      const vol = (s.volume / 100).toFixed(2);
      ffmpeg["af"] = `volume=${vol}`;
    }
  }

  // Map output format to Transloadit preset name
  // See: https://transloadit.com/docs/presets/video/
  const presetMap: Record<string, string> = {
    mp4: "ipad",
    m4v: "ipad",
    mov: "ipad",        // MOV uses same H.264+AAC as MP4
    mkv: "ipad",        // MKV container, re-muxed from H.264+AAC
    webm: "webm",
    flv: "flash",
    wmv: "wmv",
    gif: "gif",
    "3gp": "android-low",
    "3g2": "android-low",
    avi: "ipad",        // AVI container with H.264+AAC
    ogv: "webm",        // OGV uses similar open codecs
    ogg: "webm",
  };

  const preset = presetMap[fmt];

  // For formats with a preset, use it. For others, specify format directly via ffmpeg.
  const stepConfig: Record<string, unknown> = {
    robot,
    use: ":original",
    ffmpeg_stack: "v6.0.0",
    result: true,
    ...stepParams,
  };

  if (preset) {
    stepConfig.preset = preset;
  }

  // For formats that need explicit container override (e.g. MOV, MKV, AVI)
  // we override the output format via ffmpeg -f flag
  const containerOverrides: Record<string, string> = {
    mov: "mov",
    mkv: "matroska",
    avi: "avi",
    ogv: "ogg",
    ts: "mpegts",
    m2ts: "mpegts",
    mts: "mpegts",
    mpg: "mpeg",
    mpeg: "mpeg",
    m4v: "mp4",
  };

  if (containerOverrides[fmt]) {
    ffmpeg["f"] = containerOverrides[fmt];
  }

  if (Object.keys(ffmpeg).length > 0) {
    stepConfig.ffmpeg = ffmpeg;
  }

  return { steps: { encoded: stepConfig } };
}

async function pollAssembly(assemblyUrl: string, maxWaitMs = 300_000): Promise<Record<string, unknown>> {
  const start = Date.now();
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(assemblyUrl);
    const data = await res.json() as Record<string, unknown>;
    const status = data.ok as string;

    console.log(`[transloadit] Assembly status: ${status}`);

    if (status === "ASSEMBLY_COMPLETED") return data;
    if (status?.startsWith("ASSEMBLY_ERROR") || data.error) {
      // Log full response for debugging
      console.error(`[transloadit] Full error response: ${JSON.stringify(data).slice(0, 2000)}`);
      const errMsg = data.error || data.message || status;
      throw new Error(`Transloadit error: ${errMsg}`);
    }

    // Back off: 3s initially, then 5s
    await delay(Date.now() - start < 30_000 ? 3000 : 5000);
  }

  throw new Error("Transloadit assembly timed out after 5 minutes");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authKey = Deno.env.get("TRANSLOADIT_AUTH_KEY");
  const authSecret = Deno.env.get("TRANSLOADIT_AUTH_SECRET");

  // Diagnostic: log key prefix (never logs full key)
  console.log(`[transloadit] authKey prefix: ${authKey?.slice(0, 6)}... length=${authKey?.length}`);
  console.log(`[transloadit] authSecret set: ${!!authSecret}, length=${authSecret?.length}`);

  if (!authKey || !authSecret) {
    return new Response(JSON.stringify({
      error: "Video processing service not configured. Please add TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET secrets."
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { conversionId?: string; inputPath?: string; outputFormat?: string; settings?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { conversionId, inputPath, outputFormat, settings } = body;

  try {
    // Mark as converting
    await supabase.from("conversions").update({ status: "converting", progress: 10 }).eq("id", conversionId);

    // Download input file from storage
    const { data: inputData, error: downloadErr } = await supabase.storage
      .from("video-uploads")
      .download(inputPath as string);

    if (downloadErr) throw new Error("Could not read uploaded file: " + downloadErr.message);

    await supabase.from("conversions").update({ progress: 20 }).eq("id", conversionId);

    // Build Transloadit assembly params — auth MUST be inside params JSON
    const assemblySteps = buildTransloaditParams(
      outputFormat as string,
      settings as Record<string, unknown> | null
    );

    // Transloadit requires an expires timestamp in auth
    const d = new Date(Date.now() + 3600_000);
    const expires = `${d.getUTCFullYear()}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${String(d.getUTCDate()).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}+00:00`;
    const params = {
      auth: { key: authKey, expires },
      ...assemblySteps,
    };

    // Sign the params JSON with HMAC-SHA384 (Transloadit requirement)
    const paramsJson = JSON.stringify(params);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(authSecret);
    const msgData = encoder.encode(paramsJson);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-384" }, false, ["sign"]);
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigHex = "sha384:" + Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Build multipart form
    const form = new FormData();
    form.append("params", paramsJson);
    form.append("signature", sigHex);

    // Get the original filename from the inputPath for Transloadit
    const inputPathStr = inputPath as string;
    const originalFilename = inputPathStr.split("/").pop() ?? "input";
    form.append("file", new File([inputData], originalFilename));

    await supabase.from("conversions").update({ progress: 30 }).eq("id", conversionId);

    // Create assembly
    const assemblyRes = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: form,
    });

    const assemblyData = await assemblyRes.json() as Record<string, unknown>;

    if (!assemblyRes.ok || assemblyData.error) {
      throw new Error(`Transloadit assembly creation failed: ${assemblyData.error || assemblyData.message || assemblyRes.status}`);
    }

    const assemblyUrl = assemblyData.assembly_ssl_url as string ?? assemblyData.assembly_url as string;
    if (!assemblyUrl) throw new Error("No assembly URL returned from Transloadit");

    await supabase.from("conversions").update({ progress: 40 }).eq("id", conversionId);

    // Poll until done
    // Update progress mid-way
    const progressInterval = setInterval(async () => {
      try {
        const { data: current } = await supabase.from("conversions").select("progress").eq("id", conversionId).single();
        if (current && (current.progress ?? 0) < 85) {
          await supabase.from("conversions").update({ progress: Math.min(85, (current.progress ?? 40) + 10) }).eq("id", conversionId);
        }
      } catch { /* ignore */ }
    }, 8000);

    let completedAssembly: Record<string, unknown>;
    try {
      completedAssembly = await pollAssembly(assemblyUrl);
    } finally {
      clearInterval(progressInterval);
    }

    await supabase.from("conversions").update({ progress: 90 }).eq("id", conversionId);

    // Extract result file URL
    const results = completedAssembly.results as Record<string, unknown[]>;
    const resultKey = Object.keys(results ?? {})[0];
    if (!resultKey || !results[resultKey]?.length) {
      throw new Error("Transloadit returned no output files");
    }

    const resultFile = results[resultKey][0] as Record<string, unknown>;
    const resultUrl = resultFile.ssl_url as string ?? resultFile.url as string;
    if (!resultUrl) throw new Error("No result URL in Transloadit response");

    // Fetch converted file
    const convertedRes = await fetch(resultUrl);
    if (!convertedRes.ok) throw new Error("Could not fetch converted file from Transloadit");
    const convertedBlob = await convertedRes.blob();

    // Upload to video-outputs
    const fmt = (outputFormat as string).toLowerCase();
    const contentType = MIME_MAP[fmt] ?? "application/octet-stream";
    const outputPath = `outputs/${conversionId}.${fmt}`;

    const { error: uploadErr } = await supabase.storage
      .from("video-outputs")
      .upload(outputPath, convertedBlob, { contentType, upsert: true });

    if (uploadErr) throw new Error("Could not save output: " + uploadErr.message);

    // Mark complete
    await supabase.from("conversions").update({
      status: "ready",
      progress: 100,
      output_path: outputPath,
    }).eq("id", conversionId);

    return new Response(JSON.stringify({ outputPath, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (conversionId) {
      await supabase.from("conversions").update({
        status: "failed",
        error_message: message,
      }).eq("id", conversionId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
