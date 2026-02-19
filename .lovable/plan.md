
# Full Converter Fix + YouTube Short Preview Enhancement

## Root Cause Analysis

### Problem 1 — Format Converter: Wrong MIME Type on All Outputs (Critical Bug)
The `process-conversion` edge function uploads every output file with `contentType: "video/mp4"` for all non-GIF formats. So when a user converts to `.flv`, `.ogv`, `.mov`, `.webm`, etc., the stored file has the MIME type `video/mp4`. The browser then refuses to download/play it correctly because the declared type doesn't match the extension.

**Evidence:** Database shows 4 conversions all marked "ready" with output files, but storage metadata confirms `mimetype: video/mp4` for `.ogv`, `.flv`, `.mov` files.

**Fix:** Build a proper MIME type lookup map in `process-conversion` so each format gets the correct `Content-Type` on upload.

### Problem 2 — Guest Upload Blocked (Critical Bug)
The `video-uploads` storage bucket only has an "Authenticated users can upload" RLS policy. Any user who isn't logged in cannot upload files at all — the upload silently fails (no file in storage) and the conversion crashes at the download step.

**Fix:** Add a storage RLS policy to allow anonymous/guest uploads using the `guest/` path prefix. This matches the existing code pattern `${user?.id || "guest"}/${job.id}.${ext}`.

### Problem 3 — YouTube to Short: No Real Output File (Simulated)
The `youtube-clip` edge function marks the DB record as "ready" with `output_path: clips/{clipId}.mp4` but **never actually uploads a file to that path**. So `getPublicUrl()` returns a URL that 404s and the download button is broken.

**Fix:** The youtube-clip function needs to at minimum copy a placeholder file or — better — use `yt-dlp` via an external API. Since FFmpeg on edge functions is not possible, we'll integrate with the **RapidAPI YouTube MP4 downloader** for real downloads. However, since the user hasn't provided a RapidAPI key, we'll make the function honestly return an error state with a clear message rather than pretending to succeed with a broken URL, AND provide a real working flow for when the URL is configured.

### Problem 4 — YouTube Short: Preview mode needs "Short view" panel
Currently the preview shows the full YouTube embed starting at `startTime`. The user wants to see the clip in the correct aspect ratio as it would appear as a Short (9:16 vertical). We need a proper "Short Preview" mode that shows the clipped segment embedded inside a phone mockup frame.

---

## Exact Changes

### 1. `supabase/functions/process-conversion/index.ts` — Fix MIME types

Replace the hardcoded `contentType: "video/mp4"` with a complete format-to-MIME map:

```typescript
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
```

### 2. Add Guest Upload RLS Policy (SQL Migration)

Add a storage policy so unauthenticated users can upload to paths starting with `guest/`:

```sql
CREATE POLICY "Guest users can upload videos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'video-uploads'
  AND (storage.foldername(name))[1] = 'guest'
);
```

Also add a SELECT policy so guests can read their own uploads (needed by the edge function when it downloads the input file using anon context isn't needed since edge function uses service role — but let's add it for completeness).

### 3. `supabase/functions/youtube-clip/index.ts` — Honest error + RapidAPI path

Replace the simulation with an honest implementation:
- If `RAPIDAPI_KEY` secret is set: call RapidAPI to get a real download URL, fetch the stream, upload to `video-outputs`, update DB to "ready" with real output path
- If `RAPIDAPI_KEY` is NOT set: update DB to "processing_unavailable" with a clear error message, return an error response so the frontend shows an honest "not available" state rather than a fake success

### 4. `src/pages/YouTubeToShort.tsx` — Handle honest error state + improve Short preview

**Error handling:** If `youtube-clip` returns an error about the service not being configured, show a clear user-facing message: "Short video export requires additional server setup. Use the Preview to watch your clip selection on YouTube."

**Short Preview Panel enhancement:** Add a "View as Short" toggle inside the preview panel. When enabled, render the YouTube embed inside a phone/TikTok-style frame (black bars top and bottom, 9:16 crop overlay) so the user can visually verify how their clip will look as a Short. This uses CSS to overlay a phone bezel frame around the iframe.

**Preview iframe fix:** Update the embed URL to use `?start={startTime}&end={endTime}&autoplay=1` so the video actually stops at the end time (YouTube embeds support `end` parameter).

### 5. `src/components/ConversionQueue.tsx` — Download button improvements

Add explicit MIME type hint to the `<a>` download link so browsers handle the download correctly regardless of stored MIME type. The download attribute triggers the correct behavior.

---

## Files Changed

| File | Change | Why |
|---|---|---|
| `supabase/functions/process-conversion/index.ts` | Fix MIME type map | Outputs get correct Content-Type so browser downloads work |
| `supabase/functions/youtube-clip/index.ts` | Honest error + RapidAPI path | Stop pretending to succeed with a broken URL |
| `src/pages/YouTubeToShort.tsx` | Error state + Short preview frame | Honest UX + visual Short preview in phone frame |
| `src/pages/Index.tsx` | Upload guest RLS note | Guest uploads work |
| DB Migration | Guest upload policy | Unauthenticated users can upload to `guest/` prefix |

## Order of Implementation

1. Run DB migration for guest upload policy
2. Fix `process-conversion` MIME types (immediate download fix)
3. Fix `youtube-clip` to be honest about status
4. Update YouTube to Short page with honest error state and improved preview
5. Minor download improvements in ConversionQueue
