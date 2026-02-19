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

  let body: { clipId?: string; url?: string; startTime?: number; endTime?: number; aspectRatio?: string; outputFormat?: string; quality?: string; watermarkText?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { clipId, url, startTime, endTime, aspectRatio, outputFormat = "mp4", quality, watermarkText } = body;

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");

    if (clipId) {
      await supabase.from("youtube_clips").update({ status: "processing", progress: 10 }).eq("id", clipId);
    }

    // ── Path A: RapidAPI real download ──────────────────────────────────────
    if (RAPIDAPI_KEY && url) {
      // Extract video ID from URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
      const videoId = videoIdMatch?.[1];
      if (!videoId) throw new Error("Could not extract YouTube video ID from URL");

      // Map quality label to RapidAPI format
      const qualityMap: Record<string, string> = {
        "2160p": "2160", "1080p": "1080", "720p": "720", "480p": "480", "360p": "360",
      };
      const qualityParam = qualityMap[quality ?? "720p"] ?? "720";

      if (clipId) {
        await supabase.from("youtube_clips").update({ progress: 30 }).eq("id", clipId);
      }

      // Call RapidAPI to get download URL
      const apiRes = await fetch(
        `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
        {
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com",
          },
        }
      );

      if (!apiRes.ok) throw new Error(`RapidAPI returned ${apiRes.status}`);
      const apiData = await apiRes.json();
      const downloadUrl = apiData.link ?? apiData.url;
      if (!downloadUrl) throw new Error("RapidAPI did not return a download URL. Check your API key and quota.");

      if (clipId) {
        await supabase.from("youtube_clips").update({ progress: 60 }).eq("id", clipId);
      }

      // Fetch the actual video/audio file
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error("Failed to fetch video file from download URL");
      const fileBytes = await fileRes.arrayBuffer();

      const MIME_MAP: Record<string, string> = {
        mp4: "video/mp4", webm: "video/webm", gif: "image/gif",
        mp3: "audio/mpeg", m4a: "audio/mp4",
      };
      const contentType = MIME_MAP[outputFormat.toLowerCase()] ?? "video/mp4";
      const outputPath = `clips/${clipId || Date.now()}.${outputFormat}`;

      const { error: uploadErr } = await supabase.storage
        .from("video-outputs")
        .upload(outputPath, fileBytes, { contentType, upsert: true });

      if (uploadErr) throw new Error("Storage upload failed: " + uploadErr.message);

      if (clipId) {
        await supabase.from("youtube_clips").update({
          status: "ready", progress: 100, output_path: outputPath,
        }).eq("id", clipId);
      }

      return new Response(JSON.stringify({ outputPath, success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Path B: No API key — return honest error ─────────────────────────────
    const errorMsg = "Short video export requires a RapidAPI key to be configured. Use the Preview to watch your clip selection on YouTube.";

    if (clipId) {
      await supabase.from("youtube_clips").update({
        status: "failed",
        error_message: errorMsg,
      }).eq("id", clipId);
    }

    return new Response(JSON.stringify({ error: errorMsg, unavailable: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (clipId) {
      await supabase.from("youtube_clips").update({
        status: "failed",
        error_message: message,
      }).eq("id", clipId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
