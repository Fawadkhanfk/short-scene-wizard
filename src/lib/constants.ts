export const VIDEO_FORMATS = [
  "MP4", "MKV", "MOV", "AVI", "WebM", "FLV", "WMV", "3GP", "3G2", "3GPP",
  "MPEG", "MPG", "M4V", "M2TS", "MTS", "TS", "VOB", "OGV", "GIF", "SWF",
  "MOD", "QT", "RM", "RMVB", "DIVX", "XVID", "ASF", "DVR-MS", "MPV", "WTV",
  "MXF", "M1V", "F4P", "F4V", "OGG"
];

export const DEVICE_FORMATS = [
  { label: "iPhone", format: "mp4", preset: "iphone" },
  { label: "Android", format: "mp4", preset: "android" },
  { label: "iPad", format: "mp4", preset: "ipad" },
  { label: "Mobile Video", format: "mp4", preset: "mobile" },
  { label: "PSP", format: "mp4", preset: "psp" },
  { label: "Xbox", format: "wmv", preset: "xbox" },
  { label: "Kindle", format: "mp4", preset: "kindle" },
];

export const CONVERTER_GRID_FORMATS = [
  "M2TS", "MTS", "MPEG", "SWF", "MOD", "M4V", "QT", "RM", "MPG", "3GPP",
  "DIVX", "VOB", "DVR-MS", "RMVB", "ASF", "3G2", "TS", "MPV", "WTV", "XVID",
  "MXF", "M1V", "F4P", "F4V", "MOV", "FLV", "WMV", "MKV", "WEBM", "3GP",
  "AVI", "MP4", "OGV", "GIF"
];

export const VIDEO_CODECS = [
  { value: "auto", label: "Auto" },
  { value: "libx264", label: "H.264" },
  { value: "libx265", label: "H.265 (HEVC)" },
  { value: "libvpx-vp9", label: "VP9" },
  { value: "libaom-av1", label: "AV1" },
  { value: "copy", label: "Copy (No Re-encode)" },
];

export const AUDIO_CODECS = [
  { value: "auto", label: "Auto" },
  { value: "aac", label: "AAC" },
  { value: "libmp3lame", label: "MP3" },
  { value: "copy", label: "Copy" },
  { value: "none", label: "Remove Audio" },
];

export const RESOLUTIONS = [
  { value: "no_change", label: "No Change" },
  { value: "3840x2160", label: "4K (3840×2160)" },
  { value: "1920x1080", label: "1080p (1920×1080)" },
  { value: "1280x720", label: "720p (1280×720)" },
  { value: "854x480", label: "480p (854×480)" },
  { value: "640x360", label: "360p (640×360)" },
  { value: "custom", label: "Custom..." },
];

export const FRAME_RATES = [
  { value: "no_change", label: "No Change" },
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
];

export const ROTATE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "90", label: "90° Clockwise" },
  { value: "180", label: "180°" },
  { value: "270", label: "90° Counter-clockwise" },
];

export const FLIP_OPTIONS = [
  { value: "none", label: "No Change" },
  { value: "hflip", label: "Horizontal Flip" },
  { value: "vflip", label: "Vertical Flip" },
];

export const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16", sublabel: "TikTok / Reels", icon: "📱" },
  { value: "1:1", label: "1:1", sublabel: "Instagram Square", icon: "⬛" },
  { value: "16:9", label: "16:9", sublabel: "Landscape / YouTube", icon: "🖥️" },
  { value: "4:3", label: "4:3", sublabel: "Classic TV", icon: "📺" },
  { value: "custom", label: "Custom", sublabel: "Enter dimensions", icon: "✏️" },
];

export const QUALITY_OPTIONS = [
  { value: "1080p", label: "1080p HD" },
  { value: "720p", label: "720p HD" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" },
];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  uploading: "Uploading...",
  converting: "Converting...",
  processing: "Processing...",
  ready: "Ready",
  failed: "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  uploading: "bg-warning text-warning-foreground",
  converting: "bg-primary text-primary-foreground",
  processing: "bg-primary text-primary-foreground",
  ready: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
};

export const FORMAT_DESCRIPTIONS: Record<string, { title: string; desc: string; ext: string }> = {
  MP4: { title: "MP4 Converter", desc: "MPEG-4 Video — the most widely supported video format.", ext: "mp4" },
  MKV: { title: "MKV Converter", desc: "Matroska Video — open-source container with multiple audio/subtitle streams.", ext: "mkv" },
  MOV: { title: "MOV Converter", desc: "QuickTime Movie — Apple's native video format, used on iOS and macOS.", ext: "mov" },
  AVI: { title: "AVI Converter", desc: "Audio Video Interleave — classic Windows video format with wide compatibility.", ext: "avi" },
  WebM: { title: "WebM Converter", desc: "Open web video format by Google — optimized for streaming.", ext: "webm" },
  FLV: { title: "FLV Converter", desc: "Flash Video — legacy streaming format from Adobe Flash era.", ext: "flv" },
  WMV: { title: "WMV Converter", desc: "Windows Media Video — Microsoft's native video format.", ext: "wmv" },
  "3GP": { title: "3GP Converter", desc: "Mobile video format designed for 3G phones.", ext: "3gp" },
  GIF: { title: "GIF Converter", desc: "Animated GIF — universal looping image format for short clips.", ext: "gif" },
  MPEG: { title: "MPEG Converter", desc: "MPEG standard video — used in DVDs and broadcast media.", ext: "mpeg" },
  OGV: { title: "OGV Converter", desc: "Ogg Video — open source format for web delivery.", ext: "ogv" },
  VOB: { title: "VOB Converter", desc: "DVD Video Object — raw DVD video container format.", ext: "vob" },
  TS: { title: "TS Converter", desc: "Transport Stream — used in broadcast TV and Blu-ray.", ext: "ts" },
  M4V: { title: "M4V Converter", desc: "iTunes Video — Apple's DRM-capable video format.", ext: "m4v" },
  MTS: { title: "MTS Converter", desc: "AVCHD Video — HD video format from camcorders.", ext: "mts" },
  M2TS: { title: "M2TS Converter", desc: "Blu-ray MPEG-2 Transport Stream format.", ext: "m2ts" },
};
