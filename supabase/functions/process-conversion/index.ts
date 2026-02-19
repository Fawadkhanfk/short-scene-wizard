import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Parse body once at the top — avoids double-read on error
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
    // Update status to converting
    await supabase.from("conversions").update({ status: "converting", progress: 20 }).eq("id", conversionId);

    // NOTE: Real FFmpeg processing would run here via a worker or external service.
    // For demo purposes, we simulate the conversion and copy the file as-is.
    // In production, integrate with a video processing service (e.g., AWS MediaConvert,
    // Transloadit, or a dedicated FFmpeg worker).

    // Download input file
    const { data: inputData, error: downloadErr } = await supabase.storage
      .from("video-uploads")
      .download(inputPath);

    if (downloadErr) throw new Error("Could not read uploaded file: " + downloadErr.message);

    await supabase.from("conversions").update({ progress: 60 }).eq("id", conversionId);

    // Generate output path
    const outputPath = `outputs/${conversionId}.${outputFormat}`;

    // MIME type map — each format gets the correct Content-Type so browsers handle downloads correctly
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
      gif: "image/gif",
      mp3: "audio/mpeg",
      aac: "audio/aac",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    };
    const contentType = MIME_MAP[outputFormat?.toLowerCase()] ?? "application/octet-stream";

    // Upload to outputs bucket (passthrough for demo — real FFmpeg would transform here)
    const { error: uploadErr } = await supabase.storage
      .from("video-outputs")
      .upload(outputPath, inputData, {
        contentType,
        upsert: true,
      });

    if (uploadErr) throw new Error("Could not save output: " + uploadErr.message);

    // Update DB record
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
