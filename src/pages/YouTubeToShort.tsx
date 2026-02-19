import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import AspectRatioSelector from "@/components/AspectRatioSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Helmet } from "react-helmet-async";
import { Youtube, Scissors, Sparkles, Download, Clock, Play, Loader2, Link as LinkIcon, Film, HardDrive, Zap } from "lucide-react";
import { toast } from "sonner";
import { QUALITY_OPTIONS } from "@/lib/constants";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";

const SITE_URL = "https://videoconvert.pro";
const OG_IMAGE = `${SITE_URL}/og-youtube-short.jpg`;

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
}

interface AIHighlight {
  startTime: number;
  endTime: number;
  title: string;
  reason: string;
  score: number;
}

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const pageTitle = "YouTube to Short Video Clipper — Free TikTok, Reels & Shorts Creator | VideoConvert Pro";
const pageDesc = "Clip any YouTube video into a vertical short for TikTok, Instagram Reels, or YouTube Shorts. AI highlight detection, 9:16 output, MP4/WebM/GIF. Free, no registration.";

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "YouTube to Short Video Clipper",
  "url": `${SITE_URL}/youtube-to-short`,
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web Browser",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": pageDesc,
  "featureList": [
    "Clip any YouTube video to short format",
    "AI-powered highlight detection",
    "9:16 vertical output for TikTok and Instagram Reels",
    "Manual trim with dual-handle slider",
    "MP4, WebM, GIF output formats",
    "Optional watermark text overlay",
    "720p and 1080p quality output",
    "No registration required",
    "Files deleted after 24 hours",
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Create a Short Video from YouTube",
  "description": "Turn any YouTube video into a TikTok, Reels, or Shorts-ready clip in five steps.",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Paste the YouTube URL", "text": "Copy any public YouTube video URL and paste it into the input field, then click Fetch Video." },
    { "@type": "HowToStep", "position": 2, "name": "Review video details", "text": "The tool loads the video title, thumbnail, channel name, and duration so you know exactly what you are clipping." },
    { "@type": "HowToStep", "position": 3, "name": "Choose your clip mode", "text": "Use Manual Clip to drag the start/end slider to your exact moment, or switch to AI Highlights to let the AI detect the most engaging segment automatically." },
    { "@type": "HowToStep", "position": 4, "name": "Set output options", "text": "Select aspect ratio (9:16 for TikTok and Reels, 16:9 for standard), output format (MP4, WebM, or GIF), quality (720p or 1080p), and an optional watermark." },
    { "@type": "HowToStep", "position": 5, "name": "Download your short", "text": "Click Create Short Video. Processing takes under a minute. Download your clip when the green success banner appears." },
  ],
};

const faqItems = [
  { q: "What is a YouTube short video clipper?", a: "A YouTube short video clipper is an online tool that lets you select a specific time range from any public YouTube video and export it as a short-form clip optimised for platforms like TikTok (9:16 vertical), Instagram Reels (9:16), or YouTube Shorts (under 60 seconds)." },
  { q: "Can I clip any YouTube video?", a: "You can clip any publicly available YouTube video. Private videos, age-restricted content, and videos with DRM restrictions cannot be processed. Most standard uploads work immediately without any account." },
  { q: "What aspect ratio should I use for TikTok?", a: "Use 9:16 at 1080×1920 pixels for TikTok. This is the native vertical format that fills the full screen on mobile devices. Instagram Reels and YouTube Shorts also use 9:16 at 1080×1920." },
  { q: "What is the maximum clip length I can export?", a: "There is no hard maximum on clip length within the tool, but platform limits apply: YouTube Shorts accepts up to 60 seconds, Instagram Reels up to 90 seconds, and TikTok up to 10 minutes. For best results keep clips under 60 seconds." },
  { q: "What does AI Highlights mode do?", a: "AI Highlights mode analyses the video transcript and engagement signals to automatically detect the most compelling 15–60 second segment. It then presents ranked highlight suggestions with start time, end time, a title, and a confidence score so you can choose the best moment." },
  { q: "Can I add a watermark to my short?", a: "Yes. In the Output Settings section, enter any text (such as your @username or website) in the Watermark Text field. The text is burned into the bottom of the video during processing." },
  { q: "What output formats are supported?", a: "You can export your short as MP4 (H.264 — recommended for all platforms), WebM (VP9 — open format, smaller files), or GIF (looping image format, no audio). MP4 is the best choice for TikTok, Reels, and Shorts." },
  { q: "How long until my video is deleted from the server?", a: "All uploaded videos and processed output files are automatically deleted from our servers within 24 hours of creation. We do not store your content permanently and do not use it for any other purpose." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(({ q, a }) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
    { "@type": "ListItem", "position": 2, "name": "YouTube Tools", "item": `${SITE_URL}/youtube-to-short` },
    { "@type": "ListItem", "position": 3, "name": "YouTube to Short Video", "item": `${SITE_URL}/youtube-to-short` },
  ],
};

const HOW_IT_WORKS = [
  { step: "1", icon: LinkIcon, title: "Paste YouTube URL", desc: "Works with any public YouTube video — shorts, long-form, playlists." },
  { step: "2", icon: Play, title: "Fetch Video Info", desc: "We load the title, thumbnail, channel name, and total duration instantly." },
  { step: "3", icon: Scissors, title: "Choose Clip Mode", desc: "Drag the Manual slider to your exact moment, or let AI Highlights detect the best segment." },
  { step: "4", icon: Film, title: "Set Aspect & Format", desc: "Pick 9:16 for TikTok/Reels/Shorts or 16:9 for standard. Choose MP4, WebM, or GIF." },
  { step: "5", icon: Download, title: "Download Your Short", desc: "Processing completes in under a minute. Download your clip ready to publish." },
];

const PLATFORM_SPECS = [
  { platform: "TikTok", ratio: "9:16", maxDuration: "10 minutes", resolution: "1080 × 1920", format: "MP4 (H.264)" },
  { platform: "Instagram Reels", ratio: "9:16", maxDuration: "90 seconds", resolution: "1080 × 1920", format: "MP4 (H.264)" },
  { platform: "YouTube Shorts", ratio: "9:16", maxDuration: "60 seconds", resolution: "1080 × 1920", format: "MP4" },
  { platform: "Twitter / X", ratio: "16:9 or 1:1", maxDuration: "2 min 20 s", resolution: "1280 × 720", format: "MP4" },
  { platform: "LinkedIn", ratio: "16:9", maxDuration: "10 minutes", resolution: "1920 × 1080", format: "MP4" },
];

const RELATED_TOOLS = [
  { href: "/youtube-downloader", label: "YouTube Downloader", icon: Youtube },
  { href: "/video-compressor", label: "Video Compressor", icon: HardDrive },
  { href: "/video-to-gif", label: "Video to GIF", icon: Zap },
  { href: "/mp4-converter", label: "Format Converter", icon: Film },
];

const YouTubeToShort = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [quality, setQuality] = useState("720p");
  const [watermark, setWatermark] = useState("");
  const [aiHighlights, setAiHighlights] = useState<AIHighlight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<AIHighlight | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const fetchVideoInfo = async () => {
    if (!url.trim()) return;
    setFetchingInfo(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-info", { body: { url: url.trim() } });
      if (error) throw error;
      setVideoInfo(data);
      setEndTime(Math.min(60, data.duration || 60));
      setOutputUrl(null);
      setAiHighlights([]);
    } catch {
      toast.error("Could not fetch video info. Please check the URL.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const fetchAIHighlights = async () => {
    if (!videoInfo) return;
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-highlights", {
        body: { url: url.trim(), title: videoInfo.title, duration: videoInfo.duration },
      });
      if (error) throw error;
      setAiHighlights(data.highlights || []);
    } catch {
      toast.error("AI analysis failed. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateShort = async () => {
    if (!videoInfo) return;
    setProcessing(true);
    setProgress(10);
    setOutputUrl(null);

    const start = selectedHighlight ? selectedHighlight.startTime : startTime;
    const end = selectedHighlight ? selectedHighlight.endTime : endTime;

    try {
      const { data: record } = await supabase
        .from("youtube_clips")
        .insert({
          user_id: user?.id || null,
          youtube_url: url,
          video_title: videoInfo.title,
          video_thumbnail: videoInfo.thumbnail,
          video_duration: videoInfo.duration,
          start_time: start,
          end_time: end,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          quality,
          watermark_text: watermark || null,
          mode,
          status: "processing",
        })
        .select()
        .single();

      setProgress(30);

      const { data: result, error } = await supabase.functions.invoke("youtube-clip", {
        body: {
          clipId: record?.id,
          url,
          startTime: start,
          endTime: end,
          aspectRatio: aspectRatio === "custom" ? `${customWidth}:${customHeight}` : aspectRatio,
          outputFormat,
          quality,
          watermarkText: watermark,
        },
      });

      if (error) throw error;
      setProgress(100);

      if (result?.outputPath) {
        const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
        setOutputUrl(urlData.publicUrl);
        toast.success("Short video created!");
      } else {
        throw new Error(result?.error || "Processing failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const duration = videoInfo?.duration || 300;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${SITE_URL}/youtube-to-short`} />
        <meta name="robots" content="index, follow" />
        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/youtube-to-short`} />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={OG_IMAGE} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={OG_IMAGE} />
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-14">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Youtube className="w-3.5 h-3.5" /> TikTok · Reels · Shorts
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            YouTube to <span className="text-gradient">Short Video</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Paste any YouTube link, pick your moment, and export for TikTok, Reels, or Shorts — free, no account needed.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-3xl mx-auto px-4 space-y-6">
          {/* URL Input */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <Label className="text-sm font-semibold mb-2 block">YouTube URL</Label>
            <div className="flex gap-3">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 h-12"
                onKeyDown={e => e.key === "Enter" && fetchVideoInfo()}
              />
              <Button
                className="gradient-primary border-0 text-white h-12 px-6 shrink-0"
                onClick={fetchVideoInfo}
                disabled={fetchingInfo || !url.trim()}
              >
                {fetchingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch Video"}
              </Button>
            </div>
          </div>

          {/* Video Info */}
          {videoInfo && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm animate-fade-in">
              <div className="flex gap-4">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-32 h-20 object-cover rounded-xl shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">{videoInfo.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{videoInfo.channelName}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(videoInfo.duration)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {videoInfo && (
            <>
              {/* Mode toggle */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <Tabs value={mode} onValueChange={v => setMode(v as "manual" | "ai")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="manual" className="gap-2">
                      <Scissors className="w-4 h-4" /> Manual Clip
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2">
                      <Sparkles className="w-4 h-4" /> AI Highlights
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-muted-foreground">Start: <span className="text-foreground font-mono">{formatTime(startTime)}</span></span>
                        <span className="text-muted-foreground">End: <span className="text-foreground font-mono">{formatTime(endTime)}</span></span>
                        <span className="text-muted-foreground">Duration: <span className="text-primary font-semibold">{formatTime(endTime - startTime)}</span></span>
                      </div>
                      <Slider
                        min={0}
                        max={duration}
                        step={1}
                        value={[startTime, endTime]}
                        onValueChange={([s, e]) => { setStartTime(s); setEndTime(e); }}
                        className="mt-2"
                      />
                      <div className="flex gap-4 mt-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Start Time (seconds)</Label>
                          <Input type="number" min={0} max={duration} value={startTime} onChange={e => setStartTime(Number(e.target.value))} className="mt-1" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">End Time (seconds)</Label>
                          <Input type="number" min={0} max={duration} value={endTime} onChange={e => setEndTime(Number(e.target.value))} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        AI will analyse the video transcript and engagement signals to suggest the most compelling moments.
                      </p>
                      <Button
                        className="gradient-primary border-0 text-white gap-2"
                        onClick={fetchAIHighlights}
                        disabled={loadingAI}
                      >
                        {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loadingAI ? "Analysing..." : "Analyse for Highlights"}
                      </Button>
                    </div>

                    {aiHighlights.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {aiHighlights.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedHighlight(selectedHighlight?.startTime === h.startTime ? null : h)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              selectedHighlight?.startTime === h.startTime
                                ? "border-primary bg-accent"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-semibold text-sm">{h.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{h.reason}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Play className="w-3 h-3" />
                                  {formatTime(h.startTime)} → {formatTime(h.endTime)}
                                  <span>({formatTime(h.endTime - h.startTime)} clip)</span>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                  {Math.round(h.score * 100)}% match
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Output Settings */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-semibold">Output Settings</h3>
                <AspectRatioSelector
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  onCustomWidthChange={setCustomWidth}
                  onCustomHeightChange={setCustomHeight}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Format</Label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Quality</Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUALITY_OPTIONS.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Watermark Text (optional)</Label>
                  <Input placeholder="@yourusername" value={watermark} onChange={e => setWatermark(e.target.value)} />
                </div>
              </div>

              {/* Create button */}
              <Button
                size="lg"
                className="w-full gradient-primary border-0 text-white h-14 text-lg font-semibold"
                onClick={handleCreateShort}
                disabled={processing || (mode === "ai" && !selectedHighlight)}
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                ) : (
                  <><Scissors className="w-5 h-5 mr-2" /> Create Short Video</>
                )}
              </Button>

              {processing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-muted-foreground">{progress}% complete</p>
                </div>
              )}

              {outputUrl && (
                <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center animate-fade-in">
                  <p className="font-semibold text-success mb-1">✓ Your short video is ready!</p>
                  <p className="text-sm text-muted-foreground mb-4">Download it now — available for 24 hours</p>
                  <Button
                    className="gradient-primary border-0 text-white gap-2"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = outputUrl;
                      a.download = `short.${outputFormat}`;
                      a.style.display = "none";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="w-4 h-4" /> Download Short
                  </Button>
                  <div className="mt-3">
                    <a href={outputUrl} download={`short.${outputFormat}`} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                      Save link as…
                    </a>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── How It Works ── */}
          <section aria-labelledby="how-it-works-heading" className="pt-4">
            <h2 id="how-it-works-heading" className="font-bold text-xl mb-6 text-center">How to Create a Short Video from YouTube</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
                <li key={step} className="flex flex-col items-center text-center p-4 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Step {step}</span>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Platform Specs Table ── */}
          <section aria-labelledby="platform-specs-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="platform-specs-heading" className="font-bold text-lg mb-4">Short Video Platform Specifications</h2>
            <p className="text-sm text-muted-foreground mb-4">Use these specifications to choose the correct aspect ratio, duration, resolution, and format for each platform.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-3 font-semibold">Platform</th>
                    <th className="text-left pb-3 font-semibold">Aspect Ratio</th>
                    <th className="text-left pb-3 font-semibold">Max Duration</th>
                    <th className="text-left pb-3 font-semibold">Resolution</th>
                    <th className="text-left pb-3 font-semibold">Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PLATFORM_SPECS.map(row => (
                    <tr key={row.platform} className="hover:bg-muted/30">
                      <td className="py-2.5 font-semibold text-xs">{row.platform}</td>
                      <td className="py-2.5 font-mono text-primary font-semibold text-xs">{row.ratio}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.maxDuration}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.resolution}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.format}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-bold text-xl mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-1.5">{q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Related Tools ── */}
          <nav aria-label="Related video tools" className="pt-2">
            <h2 className="font-bold text-lg mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RELATED_TOOLS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-sm font-medium"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </section>
    </>
  );
};

export default YouTubeToShort;
