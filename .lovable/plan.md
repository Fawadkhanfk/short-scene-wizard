
# 🎬 VideoConvert Pro — Full-Stack Video Converter & YouTube Clip Tool

A complete FreeConvert-inspired video conversion platform with a powerful YouTube long-to-short video clipper, powered by Supabase backend + FFmpeg processing.

---

## 🗂️ Pages & Routes

### 1. **Home / Video Converter** (`/`)
The main landing page — mirrors FreeConvert's primary video converter page:
- Hero section: "Online Video Converter" with tagline
- **Upload Zone**: Drag & drop area with dashed border, "Choose Files" button with dropdown options:
  - From Device (file picker)
  - From URL (paste a direct video link)
  - From Google Drive / Dropbox / OneDrive (UI toggle, shows "coming soon" or links)
- **Output format selector**: Dropdown showing all supported formats (MP4, MKV, MOV, AVI, WebM, FLV, WMV, 3GP, GIF, TS, VOB, OGV, MPEG, etc.)
- **Advanced Settings panel** (collapsible accordion):
  - Video Codec (Auto, H.264, H.265, VP9, AV1, Copy)
  - Resize Video (No change, 1080p, 720p, 480p, 360p, Custom WxH, Aspect Ratio)
  - Video Frame Rate (No change, 24fps, 30fps, 60fps)
  - Rotate Video (None, 90°, 180°, 270°)
  - Flip Video (No change, Horizontal, Vertical)
  - Add Subtitle (upload .srt/.ass, Hard/Soft sub mode)
  - Audio Codec (Auto, AAC, MP3, Copy, None)
  - Adjust Volume (0–400% slider)
  - Fade In / Fade Out Audio toggles
  - Remove Audio toggle
  - Trim Start / Trim End (HH:MM:SS.MS inputs)
  - Crop (Width x Height, Position X, Position Y)
  - Video Bitrate (Auto or custom kbps)
  - Audio Bitrate (Auto or custom kbps)
- **"Convert" button** → uploads file to Supabase Storage, queues FFmpeg conversion job
- **Progress tracker**: Per-file progress bar, status (Uploading → Converting → Ready)
- **Download button** after conversion completes
- **Features section**: "Convert Any Video", "Best Quality", "Free & Secure" cards
- **Specific video converters grid** (from the uploaded screenshots): M2TS, MTS, MPEG, SWF, MOD, M4V, QT, RM, MPG, 3GPP, DIVX, VOB, DVR-MS, RMVB, ASF, 3G2, TS, MPV, WTV, XVID, MXF, M1V, F4P, F4V, Mobile Video, iPhone, Android, PSP, iPad, Xbox, Kindle, MOV, FLV, WMV, MKV, WEBM, 3GP, AVI, MP4, OGV — all as clickable links
- Security trust section (SSL, Secured Data Centers, Access Control badges)

---

### 2. **Format-Specific Converter Pages** (dynamic route `/:format-converter`)
Each format (MP4, MKV, MOV, AVI, WebM, FLV, WMV, 3GP, MPEG, GIF, VOB, TS, etc.) gets its own dedicated page:
- Custom title: e.g. "MP4 Converter — Convert to & from MP4 Free"
- Same upload + advanced settings panel as home
- Format-specific FAQ section
- "Convert to/from [FORMAT]" popular conversions grid below (e.g. on MKV page: MKV to MP4, MKV to AVI, MKV to MOV...)
- Breadcrumb navigation: Home → Video Converter → MP4 Converter
- SEO-friendly content block about the format

---

### 3. **YouTube Clip Tool** (`/youtube-to-short`)
The flagship original feature — not on FreeConvert:
- **"YouTube to Short Video"** hero with subtitle: "Paste any YouTube link, pick your moment, export for TikTok, Reels, or Shorts"
- **YouTube URL input field** with "Fetch Video" button
- After URL is pasted → shows video thumbnail, title, duration, channel name (via YouTube oEmbed API)
- **Mode toggle**: 
  - "Manual Clip" — user sets Start Time and End Time with a timeline slider (visual waveform/timeline scrubber showing HH:MM:SS)
  - "AI Highlights" — AI suggests 3–5 best moments from the video (most engaging, viral-worthy segments) with previews + confidence scores
- **Output Format selector**:
  - TikTok / Reels (9:16 vertical portrait)
  - Square (1:1 for Instagram feed)
  - Landscape (16:9 for YouTube/Twitter)
  - Custom (user enters exact width × height)
- **Output file format**: MP4 (default), WebM, GIF
- **Video quality**: 1080p, 720p, 480p, 360p
- Optional: Add watermark text / logo overlay
- Optional: Add captions (auto-generate or upload SRT)
- **"Create Short" button** → triggers backend processing pipeline
- Progress indicator → Download button when ready
- Example use cases shown below: "Create a YouTube highlight reel", "Clip a tutorial moment", "Extract a product demo"

---

### 4. **Video to GIF Converter** (`/video-to-gif`)
Dedicated page for the popular video-to-gif tool:
- Upload or paste URL
- Select FPS (5, 10, 15, 24), dimensions, start/end trim
- Color palette (Auto, 64, 128, 256 colors)
- Optimization quality slider
- Preview GIF before downloading

---

### 5. **Compress Video** (`/video-compressor`)
- Upload video file
- Target file size input (MB) OR quality slider (1–100)
- Resolution option (keep original or downscale)
- Shows estimated output size in real-time
- Progress + Download

---

### 6. **Auth Pages** (`/login`, `/signup`, `/reset-password`)
Optional accounts:
- Email + password signup/login
- Password reset flow
- After login: user gets conversion history, larger file limits badge
- Guest users see a "Sign up for higher limits" banner

---

### 7. **Dashboard / Conversion History** (`/dashboard`) *(logged-in only)*
- Table of all past conversions: filename, from format, to format, date, status, download link
- Re-download completed files (if not expired)
- Account settings (email, password change)

---

## 🧩 Key Components

| Component | Description |
|---|---|
| `UploadZone` | Drag-drop + button, supports multi-file |
| `FormatSelector` | Searchable dropdown of 60+ formats |
| `AdvancedSettings` | Collapsible accordion with all codec/trim/crop/audio options |
| `ConversionQueue` | File list with per-file progress bars & status badges |
| `YouTubeInput` | URL paste + thumbnail preview fetcher |
| `TimelineSlider` | Visual range slider for selecting clip start/end |
| `AIHighlights` | Cards showing AI-suggested clip moments |
| `AspectRatioSelector` | Visual 9:16 / 1:1 / 16:9 / Custom buttons |
| `ConverterGrid` | Grid of all specific format converter links |
| `BreadcrumbNav` | Multi-level breadcrumb navigation |
| `ConversionResult` | Download card with file info + copy link |

---

## 🔧 Backend Architecture (Supabase + FFmpeg)

### Supabase Storage Buckets
- `video-uploads` — raw uploaded files (auto-delete after 24h)
- `video-outputs` — converted output files (auto-delete after 24h)

### Database Tables
- `conversions` — tracks every job: user_id, input_file, output_file, format, settings, status, created_at
- `profiles` — optional user profile (email, plan tier)

### Edge Functions
1. **`process-conversion`** — receives file reference + settings, runs FFmpeg conversion (via child process or subprocess call), saves output to storage, updates status
2. **`youtube-info`** — fetches YouTube video metadata (title, thumbnail, duration) via oEmbed
3. **`youtube-clip`** — downloads YouTube video segment, applies FFmpeg clip + aspect ratio transform, saves output
4. **`ai-highlights`** — calls an AI API to analyze transcript/captions from YouTube and identify the top engaging moments

### Auth
- Supabase Auth with email/password
- Profiles table for storing conversion history
- RLS policies: users can only see their own conversions

---

## 🎨 Design System

Inspired by FreeConvert's clean, professional look:
- **Colors**: Indigo/violet primary (#6366f1), white background, soft gray sections
- **Typography**: Clean sans-serif, bold page titles, readable body
- **Components**: Rounded cards, subtle shadows, dashed upload borders
- **Trust signals**: SSL badge, file deletion notice, privacy guarantee banners
- **Navigation**: Top nav with Convert, Tools, Pricing menus
- **Breadcrumbs** on all sub-pages
- **Dark mode** support
- Fully **responsive** (mobile-first)

---

## 📋 Supported Formats (60+)

**Input/Output Video**: MP4, MKV, MOV, AVI, WebM, FLV, WMV, 3GP, 3G2, 3GPP, MPEG, MPG, M4V, M2TS, MTS, TS, VOB, OGV, GIF, SWF, MOD, QT, RM, RMVB, DIVX, XVID, ASF, DVR-MS, MPV, WTV, MXF, M1V, F4P, F4V

**Device-Specific Presets**: iPhone (MOV→MP4), Android, iPad, Mobile, PSP, Xbox, Kindle

**Output-only Special**: GIF, Animated WebP

---

## 🔑 Feature Priority Order

1. ✅ Main video converter page with upload + format select + advanced settings
2. ✅ 40+ format-specific converter pages (dynamic routing)
3. ✅ Supabase backend + FFmpeg edge function for actual conversion
4. ✅ YouTube URL clip tool with manual time range picker
5. ✅ Aspect ratio / short video format selection (9:16, 1:1, 16:9, custom)
6. ✅ AI Highlights suggestion feature
7. ✅ Video to GIF page
8. ✅ Video Compressor page
9. ✅ Optional auth + conversion history dashboard
10. ✅ Video preview player before/after conversion
