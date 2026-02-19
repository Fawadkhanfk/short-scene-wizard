import React, { useState, useRef } from "react";
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
import { Youtube, Scissors, Sparkles, Download, Clock, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QUALITY_OPTIONS } from "@/lib/constants";
import { Slider } from "@/components/ui/slider";

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
      const { data, error } = await supabase.functions.invoke("youtube-info", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      setVideoInfo(data);
      setEndTime(Math.min(60, data.duration || 60));
      setOutputUrl(null);
      setAiHighlights([]);
    } catch (err) {
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
    } catch (err) {
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
      const message = err instanceof Error ? err.message : "Processing failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const duration = videoInfo?.duration || 300;

  return (
    <>
      <Helmet>
        <title>YouTube to Short Video — Clip YouTube Videos for TikTok & Reels | VideoConvert Pro</title>
        <meta name="description" content="Paste any YouTube link, select a moment, and export as a short video for TikTok, Instagram Reels, or YouTube Shorts. Free online tool." />
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
            Paste any YouTube link, pick your moment, and export for TikTok, Reels, or Shorts.
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
                          <Input
                            type="number"
                            min={0}
                            max={duration}
                            value={startTime}
                            onChange={e => setStartTime(Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">End Time (seconds)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={duration}
                            value={endTime}
                            onChange={e => setEndTime(Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        AI will analyze the video and suggest the most engaging moments.
                      </p>
                      <Button
                        className="gradient-primary border-0 text-white gap-2"
                        onClick={fetchAIHighlights}
                        disabled={loadingAI}
                      >
                        {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loadingAI ? "Analyzing..." : "Analyze for Highlights"}
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
                                <span className="text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-full">
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
                  <Input
                    placeholder="@yourusername"
                    value={watermark}
                    onChange={e => setWatermark(e.target.value)}
                  />
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
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4" /> Download Short
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Use cases */}
          {!videoInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { icon: "🎬", title: "Highlight Reels", desc: "Extract the best moments from long videos" },
                { icon: "📚", title: "Tutorial Clips", desc: "Clip specific tutorial steps" },
                { icon: "🛍️", title: "Product Demos", desc: "Extract product showcase moments" },
              ].map(c => (
                <div key={c.title} className="p-4 rounded-xl border border-border text-center">
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <p className="font-semibold text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default YouTubeToShort;
