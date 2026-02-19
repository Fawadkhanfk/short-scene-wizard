import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Youtube, Download, Loader2, Clock, Music, Film, AlertCircle, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  channelName: string;
}

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const DOWNLOAD_OPTIONS = [
  { value: "1080p-mp4", label: "1080p HD — MP4 (H.264)", icon: Film, desc: "Best quality, largest file" },
  { value: "720p-mp4", label: "720p HD — MP4 (H.264)", icon: Film, desc: "Good quality, medium size" },
  { value: "480p-mp4", label: "480p — MP4 (H.264)", icon: Film, desc: "Standard quality, small size" },
  { value: "360p-mp4", label: "360p — MP4 (H.264)", icon: Film, desc: "Low quality, smallest video file" },
  { value: "audio-mp3", label: "Audio Only — MP3 (128kbps)", icon: Music, desc: "Extract audio track only" },
  { value: "audio-aac", label: "Audio Only — AAC (High Quality)", icon: Music, desc: "Higher quality audio extraction" },
];

const FAQ = [
  { q: "Is the YouTube downloader free?", a: "Yes, completely free. No registration, no watermark, no limits on the number of downloads. Download as many YouTube videos as you need." },
  { q: "What video quality options are available?", a: "We support 1080p HD, 720p HD, 480p, and 360p for video. For audio, we offer MP3 128kbps and AAC high quality extraction from any YouTube video." },
  { q: "Can I download YouTube videos as MP3?", a: "Yes. Select 'Audio Only — MP3' from the format dropdown to extract the audio track. This is perfect for podcasts, lectures, music, and educational content." },
  { q: "Is it legal to download YouTube videos?", a: "Downloading YouTube videos for personal, offline viewing is generally acceptable under fair use. Downloading copyrighted content for redistribution or commercial use violates YouTube's Terms of Service and copyright law. Always respect content creator rights." },
  { q: "Why won't my YouTube link work?", a: "Make sure you're using a standard YouTube URL (youtube.com/watch?v=... or youtu.be/...). Private videos, age-restricted videos, and live streams cannot be downloaded." },
  { q: "How long are downloaded files available?", a: "Downloaded files are available for 24 hours after processing. After that, they are automatically deleted from our servers for privacy." },
  { q: "Can I download YouTube Shorts?", a: "Yes. YouTube Shorts URLs (youtube.com/shorts/...) are fully supported. Select 9:16 vertical format for the best Shorts output." },
  { q: "What is the maximum YouTube video length I can download?", a: "Our converter supports videos up to 2 hours in length. For longer videos, use our YouTube Clipper to extract specific segments." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Paste the YouTube URL", desc: "Copy the video URL from YouTube and paste it into the field above. Works with youtube.com and youtu.be links." },
  { step: "2", title: "Click Fetch Video", desc: "We retrieve the video title, thumbnail, duration, and available quality options." },
  { step: "3", title: "Choose your format", desc: "Select video quality (1080p–360p) or audio only (MP3/AAC) depending on your needs." },
  { step: "4", title: "Download instantly", desc: "Click Download. Your file is processed in the cloud and delivered directly to your device." },
];

const YouTubeDownloader = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [selectedOption, setSelectedOption] = useState("720p-mp4");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const fetchVideoInfo = async () => {
    if (!url.trim()) return;
    setFetchingInfo(true);
    setVideoInfo(null);
    setOutputUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-info", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      setVideoInfo(data);
    } catch {
      toast.error("Could not fetch video info. Please check the URL and try again.");
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    setProcessing(true);
    setProgress(10);
    setOutputUrl(null);

    const isAudio = selectedOption.startsWith("audio");
    const quality = selectedOption.split("-")[0];
    const format = isAudio ? selectedOption.split("-")[1] : "mp4";

    try {
      const { data: record } = await supabase
        .from("youtube_clips")
        .insert({
          user_id: user?.id || null,
          youtube_url: url,
          video_title: videoInfo.title,
          video_thumbnail: videoInfo.thumbnail,
          video_duration: videoInfo.duration,
          start_time: 0,
          end_time: videoInfo.duration,
          aspect_ratio: "16:9",
          output_format: format,
          quality: isAudio ? "audio" : quality,
          mode: "manual",
          status: "processing",
        })
        .select()
        .single();

      setProgress(30);

      const { data: result, error } = await supabase.functions.invoke("youtube-clip", {
        body: {
          clipId: record?.id,
          url,
          startTime: 0,
          endTime: videoInfo.duration,
          aspectRatio: "16:9",
          outputFormat: format,
          quality: isAudio ? "audio" : quality,
        },
      });

      if (error) throw error;
      setProgress(100);

      if (result?.outputPath) {
        const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
        setOutputUrl(urlData.publicUrl);
        const ext = isAudio ? format : "mp4";
        const filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, "_").slice(0, 60)}.${ext}`;
        triggerDownload(urlData.publicUrl, filename);
        toast.success("Download started!");
      } else {
        throw new Error(result?.error || "Download failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const selectedOptionData = DOWNLOAD_OPTIONS.find(o => o.value === selectedOption);

  return (
    <>
      <Helmet>
        <title>YouTube Video Downloader — Free Download MP4 & MP3 | VideoConvert Pro</title>
        <meta name="description" content="Download YouTube videos free in 1080p, 720p, 480p, or as MP3 audio. Fast, secure, no registration. Works with all YouTube videos and Shorts." />
        <link rel="canonical" href="https://videoconvert.pro/youtube-downloader" />
        <meta property="og:title" content="YouTube Video Downloader — Free Download MP4 & MP3 | VideoConvert Pro" />
        <meta property="og:description" content="Download YouTube videos free in 1080p, 720p, 480p, or as MP3 audio. No registration required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://videoconvert.pro/youtube-downloader" />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="YouTube Video Downloader — Free Download MP4 & MP3" />
        <meta name="twitter:description" content="Download YouTube videos free in 1080p HD, 720p, or as MP3 audio. Fast and secure." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "YouTube Video Downloader",
          "url": "https://videoconvert.pro/youtube-downloader",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": "Free online YouTube video downloader. Download YouTube videos in 1080p, 720p, 480p, or extract MP3 audio.",
          "featureList": ["1080p HD download", "720p HD download", "MP3 audio extraction", "YouTube Shorts support", "No registration required"],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-14">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Youtube className="w-3.5 h-3.5" /> 1080p · MP3 · Shorts · Free
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            YouTube <span className="text-gradient">Video Downloader</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Download any YouTube video as MP4 in 1080p, 720p, or extract as MP3 audio. Free, fast, no registration.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-3xl mx-auto px-4 space-y-6">
          {/* URL Input */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <Label className="text-sm font-semibold mb-2 block">YouTube Video URL</Label>
            <div className="flex gap-3">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
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

          {/* Video Preview */}
          {videoInfo && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              <div className="flex gap-4 p-5">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-36 h-24 object-cover rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm line-clamp-2 mb-1">{videoInfo.title}</h2>
                  <p className="text-xs text-muted-foreground mb-2">{videoInfo.channelName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(videoInfo.duration)}
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-5 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Download Format & Quality</Label>
                  <Select value={selectedOption} onValueChange={setSelectedOption}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Video</div>
                      {DOWNLOAD_OPTIONS.filter(o => !o.value.startsWith("audio")).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t mt-1 pt-2">Audio Only</div>
                      {DOWNLOAD_OPTIONS.filter(o => o.value.startsWith("audio")).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOptionData && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <selectedOptionData.icon className="w-3.5 h-3.5" />
                      {selectedOptionData.desc}
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full gradient-primary border-0 text-white h-12 font-semibold gap-2"
                  onClick={handleDownload}
                  disabled={processing}
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download {selectedOptionData?.label.split(" — ")[0]}</>
                  )}
                </Button>

                {processing && (
                  <div className="space-y-1.5">
                    <Progress value={progress} />
                    <p className="text-xs text-center text-muted-foreground">{progress}% — Processing your download…</p>
                  </div>
                )}

                {outputUrl && (
                  <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center animate-fade-in">
                    <p className="font-semibold text-success text-sm mb-2">✓ Ready to download!</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const ext = selectedOption.startsWith("audio") ? selectedOption.split("-")[1] : "mp4";
                        const filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, "_").slice(0, 60)}.${ext}`;
                        triggerDownload(outputUrl, filename);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" /> Download Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="flex gap-3 p-4 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">Personal use only.</strong> Downloading YouTube videos is intended for offline personal viewing.
              Redistribution, commercial use, or downloading copyrighted content without permission may violate YouTube's Terms of Service and applicable copyright law.
              Always respect content creators and their rights.
            </p>
          </div>

          {/* How It Works */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-6 text-center">How to Download YouTube Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HOW_IT_WORKS.map(item => (
                <div key={item.step} className="flex gap-4 p-4 bg-card border border-border rounded-xl">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Comparison Table */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Download Format Comparison</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Format</th>
                    <th className="text-left px-4 py-3 font-semibold">Quality</th>
                    <th className="text-left px-4 py-3 font-semibold">File Size</th>
                    <th className="text-left px-4 py-3 font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { fmt: "MP4 1080p", q: "Full HD", size: "~300–600 MB/hr", use: "Editing, archiving, TV playback" },
                    { fmt: "MP4 720p", q: "HD", size: "~150–300 MB/hr", use: "Sharing, streaming, most devices" },
                    { fmt: "MP4 480p", q: "Standard", size: "~80–150 MB/hr", use: "Mobile viewing, low storage" },
                    { fmt: "MP4 360p", q: "Low", size: "~40–80 MB/hr", use: "Slow connections, tiny storage" },
                    { fmt: "MP3 Audio", q: "128kbps", size: "~60 MB/hr", use: "Podcasts, music, lectures" },
                    { fmt: "AAC Audio", q: "High", size: "~80 MB/hr", use: "Best audio quality, Apple devices" },
                  ].map(row => (
                    <tr key={row.fmt} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-primary text-xs">{row.fmt}</td>
                      <td className="px-4 py-3 text-xs">{row.q}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.size}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQ.map(faq => (
                <div key={faq.q} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Tools */}
          <div className="mt-10 p-6 bg-accent rounded-2xl">
            <h2 className="font-bold mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/youtube-to-short" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium flex items-center gap-2">
                <Scissors className="w-4 h-4 text-primary" /> YouTube to Short Clip
              </Link>
              <Link to="/video-to-gif" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> Video to GIF
              </Link>
              <Link to="/video-compressor" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" /> Video Compressor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default YouTubeDownloader;
