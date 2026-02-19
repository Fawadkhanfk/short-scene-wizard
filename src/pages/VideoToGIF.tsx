import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import UploadZone from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Zap, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const SITE_URL = "https://videoconvert.pro";

const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const VideoToGIF = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fps, setFps] = useState("10");
  const [colors, setColors] = useState("256");
  const [quality, setQuality] = useState(85);
  const [trimStart, setTrimStart] = useState("");
  const [trimEnd, setTrimEnd] = useState("");
  const [width, setWidth] = useState("");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setOutputUrl(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(10);

    try {
      const id = uuidv4();
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user?.id || "guest"}/${id}.${ext}`;

      await supabase.storage.from("video-uploads").upload(path, file, { upsert: true });
      setProgress(40);

      const { data: record } = await supabase
        .from("conversions")
        .insert({
          user_id: user?.id || null,
          input_filename: file.name,
          input_format: ext,
          output_format: "gif",
          status: "converting",
          input_path: path,
          file_size: file.size,
          settings: { fps, colors, quality, trimStart, trimEnd, width },
        })
        .select()
        .single();

      setProgress(50);

      const { data: result, error } = await supabase.functions.invoke("process-conversion", {
        body: {
          conversionId: record?.id,
          inputPath: path,
          outputFormat: "gif",
          settings: { fps, colors, quality, trimStart, trimEnd, width },
        },
      });

      if (error) throw error;
      setProgress(100);

      if (result?.outputPath) {
        const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
        setOutputUrl(urlData.publicUrl);
        toast.success("GIF created!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  const pageTitle = "Video to GIF Converter — Free Online Tool | VideoConvert Pro";
  const pageDesc = "Convert any video to animated GIF online. Control FPS, colors, quality, and trim. Free, fast, no registration required. MP4, MOV, MKV, WebM to GIF.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${SITE_URL}/video-to-gif`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/video-to-gif`} />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Video to GIF Converter",
          "url": `${SITE_URL}/video-to-gif`,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": pageDesc,
          "featureList": ["Custom FPS control", "Color palette selection", "Trim video", "Resize GIF", "Free, no registration"],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Convert Video to GIF Online",
          "step": [
            { "@type": "HowToStep", "position": 1, "text": "Upload your video file (MP4, MOV, MKV, WebM, or any format)" },
            { "@type": "HowToStep", "position": 2, "text": "Choose your GIF settings: frame rate (FPS), color palette, and quality" },
            { "@type": "HowToStep", "position": 3, "text": "Optionally trim the video and set a maximum width" },
            { "@type": "HowToStep", "position": 4, "text": "Click Convert to GIF and wait for processing" },
            { "@type": "HowToStep", "position": 5, "text": "Preview and download your animated GIF" },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "What FPS should I use for a GIF?", "acceptedAnswer": { "@type": "Answer", "text": "10–15 fps is the sweet spot for most GIFs. Use 24 fps only for smooth motion. Lower FPS means dramatically smaller file sizes." } },
            { "@type": "Question", "name": "Why is my GIF file so large?", "acceptedAnswer": { "@type": "Answer", "text": "GIFs are inherently large because they store every frame. Reduce size by lowering FPS, reducing dimensions, and limiting colors to 64–128." } },
            { "@type": "Question", "name": "Should I use GIF or MP4 for website animations?", "acceptedAnswer": { "@type": "Answer", "text": "MP4/WebM are 95% smaller than equivalent GIFs and look better. Use GIF only when you need a self-playing image without JavaScript." } },
            { "@type": "Question", "name": "What video formats can I convert to GIF?", "acceptedAnswer": { "@type": "Answer", "text": "You can convert MP4, MOV, MKV, AVI, WebM, FLV, and 60+ other video formats to GIF using our free online converter." } },
          ],
        })}</script>
      </Helmet>

      <section className="gradient-hero py-14">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Video to <span className="text-gradient">GIF</span> Converter
          </h1>
          <p className="text-muted-foreground text-lg">Convert any video to a high-quality animated GIF — free, no registration.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-2xl mx-auto px-4 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <UploadZone onFilesSelected={handleFiles} multiple={false} />
            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {file && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-semibold">GIF Settings</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Frame Rate (FPS)</Label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[
                        { v: "5", l: "5 fps — Smallest file" },
                        { v: "10", l: "10 fps — Recommended" },
                        { v: "15", l: "15 fps — Smooth" },
                        { v: "24", l: "24 fps — Cinema quality" },
                      ].map(f => (
                        <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Color Palette</Label>
                  <Select value={colors} onValueChange={setColors}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="64">64 colors — Smallest</SelectItem>
                      <SelectItem value="128">128 colors — Balanced</SelectItem>
                      <SelectItem value="256">256 colors — Best quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Quality — {quality}%
                </Label>
                <Slider min={10} max={100} step={5} value={[quality]} onValueChange={([v]) => setQuality(v)} />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Max Width (px, leave blank for original)</Label>
                <Input placeholder="e.g. 480" value={width} onChange={e => setWidth(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim Start (seconds)</Label>
                  <Input placeholder="0" value={trimStart} onChange={e => setTrimStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim End (seconds)</Label>
                  <Input placeholder="10" value={trimEnd} onChange={e => setTrimEnd(e.target.value)} />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gradient-primary border-0 text-white h-12"
                onClick={handleConvert}
                disabled={converting}
              >
                {converting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {converting ? "Creating GIF..." : "Convert to GIF"}
              </Button>

              {converting && <Progress value={progress} />}

              {outputUrl && (
                <div className="text-center pt-4 animate-fade-in">
                  <img src={outputUrl} alt="GIF preview" className="max-w-full rounded-xl mx-auto mb-4 max-h-60 object-contain" />
                  <Button
                    className="gradient-primary border-0 text-white gap-2"
                    onClick={() => triggerDownload(outputUrl, `${file.name.replace(/\.[^.]+$/, "")}.gif`)}
                  >
                    <Download className="w-4 h-4" /> Download GIF
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* GIF Settings Guide */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">GIF Settings Explained</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-3 font-semibold">FPS</th>
                    <th className="text-left pb-3 font-semibold">File Size Impact</th>
                    <th className="text-left pb-3 font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { fps: "5 fps", size: "Smallest (−70%)", use: "Simple animations, loading spinners" },
                    { fps: "10 fps", size: "Small (−50%)", use: "Most GIFs, reactions, memes" },
                    { fps: "15 fps", size: "Medium (−25%)", use: "Smooth motion, product demos" },
                    { fps: "24 fps", size: "Largest", use: "High-fidelity clips, film content" },
                  ].map(row => (
                    <tr key={row.fps} className="hover:bg-muted/30">
                      <td className="py-2.5 font-mono text-primary font-semibold text-xs">{row.fps}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.size}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-6">
            <h2 className="font-bold text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                { q: "What is the maximum recommended GIF size?", a: "Keep GIFs under 5 seconds and 480px wide for messaging apps. A 10s 480p GIF at 15fps can exceed 20MB. Use MP4 for longer clips." },
                { q: "GIF vs MP4: which is better for websites?", a: "MP4/WebM are 95% smaller and look better. Use GIF only when you need self-playing images without a video player." },
                { q: "Can I convert YouTube videos to GIF?", a: "Yes! First download the video using our YouTube Downloader, then upload it here to convert to GIF." },
                { q: "Does GIF support audio?", a: "No. GIF is an image format and does not support audio. If you need sound, convert to MP4 or WebM instead." },
              ].map(faq => (
                <div key={faq.q} className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default VideoToGIF;
