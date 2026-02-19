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
  "MP4", "MKV", "MOV", "AVI", "WebM", "GIF",
  "FLV", "WMV", "3GP", "3G2", "MPEG", "MPG",
  "M4V", "M2TS", "MTS", "TS", "VOB", "OGV",
  "SWF", "MOD", "QT", "RM", "RMVB", "DIVX",
  "XVID", "ASF", "DVR-MS", "MPV", "WTV", "MXF",
  "M1V", "F4P", "F4V", "OGG", "3GPP",
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

export const FORMAT_DESCRIPTIONS: Record<string, { title: string; desc: string; ext: string; about: string; useCase: string }> = {
  MP4: {
    title: "MP4 Converter",
    desc: "MPEG-4 Video — the most widely supported video format on every device and platform.",
    ext: "mp4",
    about: "MP4 (MPEG-4 Part 14) is the de facto standard for digital video. It uses H.264 or H.265 video compression paired with AAC audio, achieving excellent quality at small file sizes. Supported natively by iOS, Android, Windows, macOS, all web browsers, smart TVs, and streaming platforms.",
    useCase: "Best for: sharing videos on social media, uploading to YouTube, playing on any device, sending via email or messaging apps.",
  },
  MKV: {
    title: "MKV Converter",
    desc: "Matroska Video — open-source container supporting multiple audio tracks, subtitles, and chapters.",
    ext: "mkv",
    about: "MKV (Matroska Video) is an open-standard container format that can hold virtually any video codec (H.264, H.265, AV1), multiple audio tracks in different languages, subtitle streams, chapter markers, and metadata. Unlike MP4, MKV has no codec restrictions.",
    useCase: "Best for: high-quality video storage, movies with multiple subtitle languages, anime, blu-ray backups, and media center playback via Kodi or VLC.",
  },
  MOV: {
    title: "MOV Converter",
    desc: "QuickTime Movie — Apple's native format used on iPhone, iPad, and macOS video workflows.",
    ext: "mov",
    about: "MOV is Apple's QuickTime container format, capable of holding ProRes, H.264, HEVC, and other codecs. iPhone cameras record in HEVC MOV by default. It supports multiple tracks including video, audio, text, and effects layers.",
    useCase: "Best for: Final Cut Pro editing, professional video production on macOS, transferring footage from iPhones, and post-production workflows.",
  },
  AVI: {
    title: "AVI Converter",
    desc: "Audio Video Interleave — classic Windows format with wide compatibility across old and new software.",
    ext: "avi",
    about: "AVI (Audio Video Interleave) is Microsoft's container format introduced in 1992. It supports a wide range of codecs including DivX, Xvid, and H.264. While older, AVI files are extremely widely supported by video editing software and legacy DVD players.",
    useCase: "Best for: compatibility with older software and DVD players, video editing in legacy Windows apps, archiving DivX/Xvid encoded content.",
  },
  WebM: {
    title: "WebM Converter",
    desc: "Open web video format by Google — royalty-free, optimized for HTML5 streaming on the web.",
    ext: "webm",
    about: "WebM is a royalty-free, open-source video format developed by Google. It uses VP8/VP9 or AV1 video codecs with Vorbis or Opus audio. WebM is natively supported in all modern browsers without plugins, making it the ideal format for embedding videos in websites.",
    useCase: "Best for: HTML5 web video embeds, web applications, reducing bandwidth on websites, and open-source projects requiring royalty-free video.",
  },
  FLV: {
    title: "FLV Converter",
    desc: "Flash Video — Adobe's legacy streaming format, still used in some legacy video archives.",
    ext: "flv",
    about: "FLV (Flash Video) was the dominant web video format from 2003–2015, used by YouTube, Vimeo, and most streaming sites before HTML5. It uses Sorenson Spark or H.264 video with MP3 or AAC audio. Modern browsers no longer support Flash, making FLV largely obsolete.",
    useCase: "Best for: converting old Flash video archives to modern formats, extracting content from legacy systems, and backward compatibility with old media players.",
  },
  WMV: {
    title: "WMV Converter",
    desc: "Windows Media Video — Microsoft's proprietary video format for Windows Media Player.",
    ext: "wmv",
    about: "WMV (Windows Media Video) is Microsoft's proprietary video codec and container. It uses Windows Media Video codec (versions 7–9) with Windows Media Audio. WMV files are optimized for Windows Media Player but have limited cross-platform support.",
    useCase: "Best for: Windows-only workflows, corporate presentations in PowerPoint, older Microsoft applications, and Xbox video playback.",
  },
  "3GP": {
    title: "3GP Converter",
    desc: "Mobile video format for 3G networks — designed for small file sizes on older phones.",
    ext: "3gp",
    about: "3GP is a multimedia container format defined by the Third Generation Partnership Project (3GPP) for mobile phones. It uses MPEG-4 video (H.263 or H.264) with AMR or AAC audio, compressed to very small file sizes suitable for 3G network transmission.",
    useCase: "Best for: converting videos for old mobile phones, reducing file size for MMS messaging, and playing media on feature phones and legacy Android devices.",
  },
  GIF: {
    title: "GIF Converter",
    desc: "Animated GIF — universal looping image format for memes, reactions, and short clips.",
    ext: "gif",
    about: "GIF (Graphics Interchange Format) was invented in 1987 and supports up to 256 colors per frame with lossless compression. Despite its age, GIF remains the universal format for short looping animations. It requires no video player — any image viewer or browser displays it automatically.",
    useCase: "Best for: social media reactions, memes, website animations, email marketing, chat applications, and short product demonstrations.",
  },
  MPEG: {
    title: "MPEG Converter",
    desc: "MPEG standard video — legacy broadcast and DVD format with widespread hardware support.",
    ext: "mpeg",
    about: "MPEG (Moving Picture Experts Group) defines several video standards. MPEG-1 is used for VCDs, MPEG-2 for DVDs and broadcast TV, and MPEG-4 for modern digital video. MPEG files use .mpg or .mpeg extension and are read natively by most media players.",
    useCase: "Best for: DVD authoring, broadcast video workflows, converting VCD/DVD content, and compatibility with older video hardware and editing suites.",
  },
  OGV: {
    title: "OGV Converter",
    desc: "Ogg Video — open-source format using Theora codec, royalty-free for web use.",
    ext: "ogv",
    about: "OGV is the video variant of the Ogg container format, using the Theora video codec with Vorbis audio. It is entirely open-source and patent-free. While largely superseded by WebM, OGV is still used in open-source projects and older Firefox-based applications.",
    useCase: "Best for: open-source projects, Wikipedia video uploads, Firefox-compatible web video without licensing restrictions, and Linux multimedia workflows.",
  },
  VOB: {
    title: "VOB Converter",
    desc: "DVD Video Object — the raw video container inside DVD discs.",
    ext: "vob",
    about: "VOB (Video Object) is the container format used in DVD-Video media. It uses MPEG-2 video, Dolby Digital (AC-3), DTS, or PCM audio, and can contain subtitle data. VOB files are found inside the VIDEO_TS folder of a DVD disc.",
    useCase: "Best for: ripping DVD content to a digital format, archiving DVD collections, extracting video from backup copies of DVDs you own.",
  },
  TS: {
    title: "TS Converter",
    desc: "MPEG Transport Stream — used in broadcast TV, Blu-ray, and DVB recording.",
    ext: "ts",
    about: "TS (Transport Stream) is a standard digital container format for broadcasting and streaming. It is robust against data loss and transmission errors, making it ideal for live TV broadcasting (DVB, ATSC), Blu-ray, and network streaming applications like HLS.",
    useCase: "Best for: converting TV recordings from DVB tuners, processing Blu-ray raw streams, HLS video streaming infrastructure, and broadcast video workflows.",
  },
  M4V: {
    title: "M4V Converter",
    desc: "iTunes Video — Apple's DRM-capable format for the iTunes Store and Apple TV.",
    ext: "m4v",
    about: "M4V is a video container format developed by Apple, nearly identical to MP4 but with optional Apple FairPlay DRM. iTunes Store movies and TV shows are delivered in M4V. Non-DRM M4V files can be played by VLC and most modern video players.",
    useCase: "Best for: removing DRM-free M4V files from iTunes, converting Apple TV content to universal formats, and playing purchased iTunes content on non-Apple devices.",
  },
  MTS: {
    title: "MTS Converter",
    desc: "AVCHD Video — high-definition camcorder format from Sony and Panasonic cameras.",
    ext: "mts",
    about: "MTS is the file extension for AVCHD (Advanced Video Coding High Definition), a digital recording format developed by Sony and Panasonic. AVCHD cameras record in 1080i/1080p/720p using H.264 video and Dolby Digital audio to MTS/M2TS files.",
    useCase: "Best for: editing footage from Sony Handycam, Panasonic camcorders, and other AVCHD-recording cameras in video editing software that requires MP4 or MOV.",
  },
  M2TS: {
    title: "M2TS Converter",
    desc: "Blu-ray MPEG-2 Transport Stream — the container for Blu-ray disc video content.",
    ext: "m2ts",
    about: "M2TS is a transport stream container format for Blu-ray disc video. It uses MPEG-2 transport stream (same as TS) and contains H.264 or VC-1 video with Dolby TrueHD, DTS-HD, or PCM audio. M2TS is the native format for Blu-ray and AVCHD camcorders.",
    useCase: "Best for: converting Blu-ray backups to MP4 for media servers, editing high-definition camcorder footage, and archiving home video collections.",
  },
  MPG: {
    title: "MPG Converter",
    desc: "MPEG video file — common extension for MPEG-1 and MPEG-2 encoded video files.",
    ext: "mpg",
    about: "MPG is the file extension commonly used for MPEG-1 and MPEG-2 video. MPEG-1 is the format used for Video CDs (VCD) at 352×240 resolution. MPEG-2 provides higher quality used in DVDs and broadcast. MPG files are widely supported by hardware DVD players.",
    useCase: "Best for: converting VCD content, processing DVD rips, working with broadcast video recordings, and archiving older video content from 1990s-2000s.",
  },
  SWF: {
    title: "SWF Converter",
    desc: "Shockwave Flash — Adobe Flash animation format, now obsolete but widely archived.",
    ext: "swf",
    about: "SWF (Shockwave Flash) is a proprietary format for Flash animations and interactive content. Adobe discontinued Flash in December 2020 and all major browsers removed Flash support. SWF files can contain vector animations, video, and interactive ActionScript code.",
    useCase: "Best for: extracting video content from legacy SWF files, archiving old Flash animations, converting Flash-based educational content to modern formats.",
  },
  DIVX: {
    title: "DivX Converter",
    desc: "DivX video format — popular codec for DVD ripping in the early 2000s, now largely replaced by H.264.",
    ext: "divx",
    about: "DivX is a video codec and container format based on MPEG-4 Part 2. It became extremely popular in the early 2000s for compressing DVD-quality video into small files. The DivX codec achieves good quality at low bitrates using psychovisual optimization.",
    useCase: "Best for: converting old DivX video collections to modern formats, playing decade-old downloaded videos, and backward-compatible DivX-certified device playback.",
  },
  XVID: {
    title: "Xvid Converter",
    desc: "Xvid — open-source MPEG-4 codec, the free alternative to DivX for video compression.",
    ext: "xvid",
    about: "Xvid is an open-source MPEG-4 video codec, the free counterpart to the proprietary DivX codec. It uses MPEG-4 Advanced Simple Profile compression and was widely used for distributing video files in AVI containers before H.264 became dominant.",
    useCase: "Best for: converting old Xvid-encoded AVI collections, playing legacy downloaded video files, and working with older video editing software that requires MPEG-4 ASP.",
  },
  MOD: {
    title: "MOD Converter",
    desc: "Camcorder video format used by JVC, Panasonic, and Canon standard-definition cameras.",
    ext: "mod",
    about: "MOD is a proprietary video file format used by JVC, Panasonic, and Canon standard-definition camcorders. It is essentially an MPEG-2 transport stream in disguise, using .MOD as the file extension. Companion .MOI files store metadata for each video.",
    useCase: "Best for: converting old standard-definition camcorder recordings to MP4, digitizing home video archives, and importing footage into video editing software.",
  },
  QT: {
    title: "QT Converter",
    desc: "QuickTime Movie — legacy Apple video format identical to MOV with a different extension.",
    ext: "qt",
    about: "QT files are QuickTime movie files functionally identical to MOV files. They use the QuickTime container and can store any QuickTime-compatible codec. The QT extension was more common in older versions of macOS and QuickTime Player.",
    useCase: "Best for: opening and converting old Mac video files, processing footage from legacy Final Cut Pro projects, and converting old QuickTime-specific content.",
  },
  RM: {
    title: "RM Converter",
    desc: "RealMedia — RealNetworks streaming format, dominant in the late 1990s for internet video.",
    ext: "rm",
    about: "RM (RealMedia) is a proprietary multimedia container format developed by RealNetworks. It uses RealVideo and RealAudio codecs optimized for streaming over low-bandwidth internet connections. RM was extremely popular from 1997–2005 for web streaming.",
    useCase: "Best for: converting old RealMedia files from 1990s-2000s internet archives, extracting content from legacy media collections, and digital archaeology of early web video.",
  },
  RMVB: {
    title: "RMVB Converter",
    desc: "RealMedia Variable Bitrate — improved RealMedia format with variable bitrate encoding for better quality.",
    ext: "rmvb",
    about: "RMVB (RealMedia Variable Bitrate) is an extension of the RM format using variable bitrate encoding. Unlike constant-bitrate RM, RMVB allocates more bits to complex scenes for better quality. It was widely used for Asian drama and anime distribution in the 2000s.",
    useCase: "Best for: converting Korean drama, Japanese anime, and Asian media collections in RMVB format, accessing legacy Asian media archives, and converting to MP4 for modern devices.",
  },
  ASF: {
    title: "ASF Converter",
    desc: "Advanced Systems Format — Microsoft container for Windows Media Audio and Video streams.",
    ext: "asf",
    about: "ASF (Advanced Systems Format) is Microsoft's container format designed for streaming media. It is the container used by Windows Media Video (WMV) and Windows Media Audio (WMA). ASF supports streaming-specific features like variable bitrate and rights management.",
    useCase: "Best for: converting Windows Media content, processing corporate streaming video archives, working with Microsoft SharePoint video content, and legacy Windows Media Server outputs.",
  },
  OGG: {
    title: "OGG Converter",
    desc: "Ogg container — open-source multimedia format for Vorbis audio and Theora video streams.",
    ext: "ogg",
    about: "OGG is a free and open container format maintained by the Xiph.Org Foundation. It can contain Vorbis audio, Theora video, FLAC audio, Opus audio, and other codecs. The format is patent-free and royalty-free, commonly used in open-source software.",
    useCase: "Best for: open-source audio/video projects, Linux audio playback, converting audio to an open format, game audio assets, and applications requiring royalty-free media.",
  },
  F4V: {
    title: "F4V Converter",
    desc: "Flash MP4 Video — Adobe's H.264-based replacement for FLV in Flash Player.",
    ext: "f4v",
    about: "F4V is Adobe's Flash MP4 video format, introduced with Flash Player 9. It uses H.264 video and AAC audio inside an MP4 container, with additional Flash-specific metadata. F4V delivers significantly better quality than FLV at the same file size.",
    useCase: "Best for: converting legacy Flash video content from 2008–2020, processing Adobe Media Encoder outputs, and extracting H.264 content from Flash-based video archives.",
  },
  WTV: {
    title: "WTV Converter",
    desc: "Windows Recorded TV Show — the format used by Windows Media Center for TV recordings.",
    ext: "wtv",
    about: "WTV (Windows Recorded TV Show) is Microsoft's format for TV recordings made with Windows Media Center. It uses MPEG-2 or H.264 video with Dolby Digital audio and contains EPG metadata, DRM information, and chapter points for recorded TV programs.",
    useCase: "Best for: converting Windows Media Center TV recordings to MP4, archiving recorded TV shows, and playing recorded television content on devices without WTV support.",
  },
  MXF: {
    title: "MXF Converter",
    desc: "Material Exchange Format — professional broadcast and post-production container for raw camera footage.",
    ext: "mxf",
    about: "MXF (Material Exchange Format) is a professional-grade container format standardized for the broadcast, film, and video post-production industry. It supports a wide range of professional codecs (DNxHD, ProRes, IMX) and is used by broadcast cameras, Avid, Adobe Premiere, and news systems.",
    useCase: "Best for: professional video post-production, converting broadcast camera footage (Avid, Sony XDCAM, Panasonic P2), news editing workflows, and archiving professional video assets.",
  },
};

export const FORMAT_FAQS: Record<string, { q: string; a: string }[]> = {
  default: [
    { q: "Is this converter free?", a: "Yes, VideoConvert Pro is completely free to use with no registration required. Upload, convert, and download." },
    { q: "How long are files stored?", a: "All uploaded and converted files are automatically deleted after 24 hours for your privacy." },
    { q: "What is the maximum file size?", a: "Free users can upload files up to 500MB. Sign up for larger file limits." },
    { q: "Is my video secure?", a: "Yes. Files are encrypted in transit, stored temporarily, and automatically deleted after 24 hours. We never share your files." },
    { q: "Do I need to install software?", a: "No. VideoConvert Pro runs entirely in your browser. No download, no installation, no plugins required." },
  ],
  MP4: [
    { q: "What is MP4 and why is it the most popular format?", a: "MP4 (MPEG-4 Part 14) is the most universally supported video container. It uses H.264 compression to deliver excellent quality at small file sizes, and is natively supported by every platform: iOS, Android, Windows, macOS, all browsers, smart TVs, and streaming services." },
    { q: "What codec should I use when converting to MP4?", a: "H.264 (libx264) is the best choice for maximum compatibility. H.265 (HEVC) gives you 50% smaller files at the same quality but requires modern devices. Use H.264 for sharing and H.265 for storage." },
    { q: "How do I convert MKV to MP4 without losing quality?", a: "Use our converter with 'Copy (No Re-encode)' codec setting. This rewraps the MKV content into an MP4 container without re-encoding, preserving perfect quality and completing in seconds." },
    { q: "Why is my MP4 file so large?", a: "Large MP4 files usually have a high bitrate or are encoded with a lossless codec. Use our Video Compressor to reduce the file size while maintaining acceptable quality." },
    { q: "Can I convert MP4 to other formats for free?", a: "Yes. VideoConvert Pro converts MP4 to MKV, MOV, AVI, WebM, GIF, and 60+ other formats completely free with no watermark or registration." },
  ],
  MKV: [
    { q: "What is the difference between MKV and MP4?", a: "MKV is a flexible container supporting multiple audio tracks, subtitle streams, and any video codec. MP4 is more restricted but universally compatible. MKV is better for storage; MP4 is better for sharing." },
    { q: "Can I convert MKV to MP4 without re-encoding?", a: "Yes. Use the 'Copy (No Re-encode)' video codec option. This extracts the H.264 stream from MKV and places it in an MP4 container without quality loss — it's also much faster." },
    { q: "Will I lose subtitles when converting MKV to MP4?", a: "Embedded text subtitles (SRT, ASS) may not transfer to MP4 since MP4 has limited subtitle support. Image-based subtitles (PGS from Blu-ray) cannot be carried in MP4 at all." },
    { q: "Why does MKV play in VLC but not Windows Media Player?", a: "Windows Media Player doesn't support MKV natively. Convert to MP4 using our free converter for full Windows compatibility, or install the VLC media player which reads MKV natively." },
    { q: "What is the best resolution for MKV storage?", a: "1080p (1920×1080) with H.265 codec is the ideal balance — you get Blu-ray quality at roughly 5–8 GB per movie. 4K with H.265 is best for large displays and future-proofing." },
  ],
  MOV: [
    { q: "Why can't I play MOV files on Windows?", a: "MOV is Apple's QuickTime format and requires QuickTime Player or VLC on Windows. The easiest solution is to convert MOV to MP4 using our free converter — MP4 plays natively in Windows Media Player." },
    { q: "Is MOV better quality than MP4?", a: "MOV and MP4 can both contain identical H.264 or H.265 streams, so quality is the same. The difference is the container. MOV supports Apple ProRes codecs for professional editing; MP4 is better for universal playback." },
    { q: "How do I convert iPhone videos (MOV/HEVC) to MP4?", a: "iPhone cameras record in HEVC (.MOV). Upload the file here, select MP4 as output format, and our converter will transcode it to H.264 MP4 — playable on every device." },
    { q: "Can I convert MOV to MP4 without losing quality?", a: "Yes, select H.264 codec at 1080p. If your MOV already contains H.264, use 'Copy (No Re-encode)' for zero-loss conversion in seconds." },
    { q: "What video editors work best with MOV files?", a: "Final Cut Pro, iMovie, and Adobe Premiere Pro all work natively with MOV. For Windows editors like DaVinci Resolve, converting to MP4 or MKV first is recommended." },
  ],
  AVI: [
    { q: "Is AVI still a good format to use?", a: "AVI is largely outdated. It doesn't support modern codecs efficiently and has no streaming capability. Convert AVI to MP4 for modern use — you'll get smaller files with better quality." },
    { q: "Why is my AVI file so large compared to MP4?", a: "AVI often uses less efficient codecs (DivX, Xvid, uncompressed) with high bitrates. Converting to MP4 with H.264 can reduce file size by 50–80% with identical or better visual quality." },
    { q: "Can I play AVI on Android or iPhone?", a: "AVI is not natively supported on iOS. Android supports it partially. Converting to MP4 ensures playback on every mobile device without additional apps." },
    { q: "What is the best codec for AVI output?", a: "If you must use AVI, DivX or Xvid (MPEG-4 ASP) are the standard choices. For modern quality use H.264 in AVI, though MP4 is a better container for H.264." },
    { q: "How do I convert old DivX AVI files to MP4?", a: "Upload your AVI file, select MP4 as output, choose H.264 codec, and click Convert. Our converter handles DivX, Xvid, and most AVI codecs automatically." },
  ],
  WebM: [
    { q: "What browsers support WebM natively?", a: "All modern browsers support WebM: Chrome, Firefox, Opera, Edge (Chromium). Safari added WebM support in Safari 14.1+. WebM with VP9 is the recommended format for embedding video on websites." },
    { q: "Should I use VP8 or VP9 for WebM?", a: "Use VP9 — it delivers 50% better compression than VP8 at the same quality, similar to H.265 vs H.264. VP9 is supported by all browsers that support VP8." },
    { q: "Is WebM better than MP4 for websites?", a: "WebM is royalty-free (no licensing costs) and has better browser support for the open web. MP4/H.264 has wider device support including older browsers and hardware decoders. Many sites serve both: WebM for browsers, MP4 as fallback." },
    { q: "How small can I make a WebM file?", a: "VP9 is extremely efficient. A 1080p WebM with VP9 can be 30–50% smaller than the equivalent H.264 MP4. Use our converter with 1280×720 at 1Mbps for web-optimized delivery." },
    { q: "Can I convert MP4 to WebM for free?", a: "Yes. Upload your MP4, select WebM as output, and our free converter will encode it with VP9. No watermark, no registration, and files are deleted after 24 hours." },
  ],
  GIF: [
    { q: "Why is my GIF file so large?", a: "GIFs are uncompressed per-frame and limited to 256 colors, making them inherently large. Reduce GIF size by lowering FPS (5–10 is usually sufficient), reducing dimensions (max 480px wide), and limiting color palette to 64–128 colors." },
    { q: "What FPS should I use for GIF conversion?", a: "10–15 fps is the sweet spot for most GIFs. Use 24 fps only for smooth motion that requires it. Lower FPS = dramatically smaller file size with minimal perceptual difference for most content." },
    { q: "Should I use GIF or MP4 for website animations?", a: "MP4/WebM are 95% smaller than equivalent GIFs and look better. Use GIF only when you need a simple image that animates without JavaScript or video player. For web performance, always prefer MP4 with autoplay/loop/muted attributes." },
    { q: "How many colors does GIF support?", a: "GIF supports a maximum of 256 colors per frame. This makes it unsuitable for photographic content but acceptable for simple graphics, logos, and cartoon-style animations." },
    { q: "What is the maximum recommended GIF length?", a: "Keep GIFs under 5 seconds for messaging apps and social media. Longer GIFs become enormous files — a 10-second 480p GIF at 15fps can exceed 20MB. Use MP4 for longer clips." },
  ],
};

export const FORMAT_HOW_TO: Record<string, { steps: string[] }> = {
  default: {
    steps: [
      "Upload your video file by dragging and dropping or clicking the upload area",
      "Select your desired output format from the dropdown menu",
      "Optionally adjust advanced settings like codec, resolution, and bitrate",
      "Click Convert and wait for the cloud processing to complete",
      "Download your converted file — ready in seconds",
    ],
  },
  MP4: {
    steps: [
      "Upload your source video (MKV, MOV, AVI, or any format) by dragging it into the upload zone",
      "The output format is pre-set to MP4 — optionally choose H.264 (best compatibility) or H.265 (smaller size) under Advanced Settings",
      "Select your target resolution: 1080p for HD, 720p for web sharing, or 4K if your source is 4K",
      "Click Convert — our cloud converter processes your video with FFmpeg",
      "Download your MP4 file — compatible with every device and platform",
    ],
  },
  GIF: {
    steps: [
      "Upload your video file (MP4, MOV, WebM, or any format supported)",
      "Set your target frame rate: 10 fps for small files, 15 fps for smooth motion, 24 fps for high fidelity",
      "Choose color palette: 64 for smallest size, 128 for balance, 256 for best quality",
      "Optionally trim your clip and set a maximum width to control GIF size",
      "Click Convert to GIF and download your animated GIF",
    ],
  },
};
