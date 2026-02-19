
# Fix the Converter: Real Format Conversion via Transloadit (Managed FFmpeg API)

## The Exact Problem

The current `process-conversion` edge function does this:

```
Upload MP4 → Download MP4 bytes → Re-upload same bytes as ".mkv" → Return URL
```

It copies the file verbatim. The output file has a renamed extension and a different MIME type header in storage metadata, but the actual video container and codec bytes are **identical to the input**. Any video player or system that inspects the file bytes will see it is an MP4 regardless of the extension.

**This is a fundamental architecture gap — the function never calls FFmpeg at all.** The comment in the code explicitly says: *"For demo purposes, we simulate the conversion."*

---

## Why FFmpeg Can't Run Directly in the Edge Function

| Constraint | Limit | FFmpeg Needs |
|---|---|---|
| Memory | 256 MB | 1–4 GB for video |
| CPU time | 2s | Minutes for encoding |
| Bundle size | 20 MB | ffmpeg.wasm = 30–60 MB |
| Execution duration | 150s | Minutes for large files |

This is a hard platform constraint. The edge function acts as an **orchestrator**, not a processor.

---

## The Solution: Transloadit (Managed FFmpeg API)

Transloadit is a dedicated video/audio processing service that runs real FFmpeg on their infrastructure. The edge function sends the file to Transloadit, Transloadit runs FFmpeg with the requested settings, and returns a processed file URL. We then store the result.

**Why Transloadit:**
- Free tier: 5 GB/month of processing
- Supports every format in the app (MP4, MKV, MOV, AVI, WebM, FLV, WMV, OGV, GIF, MP3, AAC, WAV, etc.)
- Supports the advanced settings already in the UI: codec, resolution, frame rate, rotate, flip, trim, crop, bitrate, audio
- The edge function just sends JSON + file → gets back a real converted file
- No server to host or maintain

---

## What Changes

### Step 1 — Add Transloadit API Keys as Secrets

Two secrets will be needed:
- `TRANSLOADIT_AUTH_KEY` — from your Transloadit account (free signup)
- `TRANSLOADIT_AUTH_SECRET` — from your Transloadit account

These will be prompted via the secrets tool before any code changes.

### Step 2 — Rewrite `supabase/functions/process-conversion/index.ts`

Replace the passthrough copy with a real Transloadit API call:

**New flow:**
1. Download the uploaded file from `video-uploads` storage (as before)
2. Build a Transloadit "assembly" request with the correct FFmpeg template for the target format + all advanced settings (codec, resolution, frame rate, rotate, flip, trim, crop, bitrate)
3. Upload the file to Transloadit with the assembly instructions
4. Poll the assembly status until complete (or use a result URL)
5. Fetch the converted output from Transloadit's result URL
6. Upload the converted file to `video-outputs` storage with the correct MIME type
7. Update the DB record to "ready" with the output path

**Transloadit assembly template (example for MP4 → MKV):**
```json
{
  "steps": {
    "encoded": {
      "robot": "/video/encode",
      "use": ":original",
      "preset": "original",
      "ffmpeg_stack": "v6.0.0",
      "ffmpeg": {
        "vcodec": "libx264",
        "acodec": "aac"
      },
      "result": true,
      "width": 1920,
      "height": 1080
    }
  }
}
```

**Settings mapping from the UI to Transloadit parameters:**

| UI Setting | Transloadit Field |
|---|---|
| `videoCodec` (libx264, libx265, libvpx-vp9) | `ffmpeg.vcodec` |
| `audioCodec` (aac, libmp3lame) | `ffmpeg.acodec` |
| `resolution` (1920x1080, 1280x720, etc.) | `width` + `height` |
| `frameRate` (24, 30, 60) | `ffmpeg.r` |
| `rotate` (90, 180, 270) | `ffmpeg.vf` (transpose filter) |
| `flip` (hflip, vflip) | `ffmpeg.vf` |
| `trimStart` / `trimEnd` | `ffmpeg.ss` + `ffmpeg.t` |
| `videoBitrate` / `audioBitrate` | `ffmpeg.b:v` + `ffmpeg.b:a` |
| `removeAudio` | `ffmpeg.an` = 1 |
| `volume` | `ffmpeg.af` = volume filter |

**GIF special case:** Use Transloadit's `/video/encode` robot with output format `gif`, which generates a proper animated GIF using palettegen + paletteuse (much better than a naive GIF encode).

**Format presets map:** For formats that need a specific container (MKV, FLV, OGV, TS, etc.), the Transloadit robot handles the container format via the output file extension + the `format` parameter, not just the codec.

### Step 3 — Update the Download Handler (Frontend Only — No File Change Needed)

The current `handleDownload` in `Index.tsx` and `FormatConverter.tsx` already uses `a.download = filename.ext` correctly. The file stored in `video-outputs` will now be a genuinely converted file, so downloads will work correctly. No frontend changes needed for the core fix.

### Step 4 — Update Job Status Tracking

The current UI shows "Converting..." while the edge function is running. Since Transloadit processing takes 10–60 seconds (real FFmpeg work), we should:
- Add a `progress` polling step: update the job progress from 50% → 90% during the Transloadit wait
- Show a message like "Processing with FFmpeg..." so users understand real work is happening

The `updateJob` calls in `Index.tsx` and `FormatConverter.tsx` already handle this — the edge function just needs to emit intermediate progress updates to the DB row (which polling from the frontend can pick up).

---

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/process-conversion/index.ts` | Full rewrite — real Transloadit FFmpeg call instead of passthrough copy |
| Secrets | Add `TRANSLOADIT_AUTH_KEY` and `TRANSLOADIT_AUTH_SECRET` |

No frontend files need to change. The fix is entirely in the edge function.

---

## Fallback If Transloadit Is Not Configured

If the `TRANSLOADIT_AUTH_KEY` secret is not set, the function will return a clear error to the frontend:

```json
{ "error": "Video processing service not configured. Please add TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET secrets." }
```

This prevents silent passthrough of unconverted files and shows users an honest error state in the queue UI (red "Failed" badge with the message).

---

## Format Coverage After Fix

| Format | Transloadit Robot | Notes |
|---|---|---|
| MP4, M4V | `/video/encode` | H.264/AAC by default |
| MKV | `/video/encode` | H.264 in Matroska container |
| MOV | `/video/encode` | QuickTime container |
| WebM | `/video/encode` | VP9/Opus |
| AVI | `/video/encode` | XviD/MP3 |
| FLV | `/video/encode` | H.264 in Flash container |
| WMV | `/video/encode` | WMV3/WMA |
| OGV | `/video/encode` | Theora/Vorbis |
| GIF | `/video/encode` | Animated GIF with palette |
| MP3, AAC, WAV, OGG, M4A | `/audio/encode` | Audio extraction/conversion |
| 3GP, TS, MTS, MXF | `/video/encode` | Mobile/broadcast containers |

All 60+ formats the UI lists are covered by Transloadit's FFmpeg engine.

---

## Prerequisites for the User

1. Create a free Transloadit account at **transloadit.com** (free tier: 5 GB/month processing)
2. Get the `Auth Key` and `Auth Secret` from the Transloadit dashboard → API Credentials
3. Enter them when prompted by the secrets tool

Once the secrets are added, the edge function will be deployed and all conversions will produce real, properly converted files.
