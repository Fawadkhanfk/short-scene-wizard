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
import { Zap, Download, Loader2, Upload, Settings, ImageIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

const SITE_URL = "https://videoconvert.pro";
const OG_IMAGE = `${SITE_URL}/og-video-to-gif.jpg`;

const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const pageTitle = "Free Video to GIF Converter Online — MP4, MOV, MKV to GIF | VideoConvert Pro";
const pageDesc = "Convert any video to animated GIF online. Control FPS, colors, quality, and trim. Free, fast, no registration required. MP4, MOV, MKV, WebM, AVI to GIF.";

const faqItems = [
  { q: "What FPS should I use for a GIF?", a: "10–15 fps is the sweet spot for most GIFs. Use 24 fps only for smooth motion. Lower FPS means dramatically smaller file sizes — 5 fps is ideal for simple animations and loading spinners." },
  { q: "Why is my GIF file so large?", a: "GIFs are inherently large because they store every frame as a palette-indexed image without inter-frame compression. Reduce size by lowering FPS to 10, reducing dimensions to 480px wide, and limiting colors to 64–128." },
  { q: "Should I use GIF or MP4 for website animations?", a: "MP4/WebM are 95% smaller than equivalent GIFs and look substantially better. Use GIF only when you need a self-playing image without JavaScript or a video player — such as in email newsletters or README files." },
  { q: "What video formats can I convert to GIF?", a: "You can convert MP4, MOV, MKV, AVI, WebM, FLV, M4V, 3GP, and 60+ other video formats to GIF using our free online converter. Any format supported by FFmpeg works." },
  { q: "Can I convert MOV to GIF?", a: "Yes. MOV files from iPhones, iPads, and macOS are fully supported. Upload your MOV file, adjust FPS and quality settings, then click Convert to GIF. Output is a standard .gif file." },
  { q: "How do I make a GIF loop continuously?", a: "All GIFs created by our converter loop continuously by default — this is a built-in property of the GIF format. There is no setting to disable looping in standard GIF files." },
  { q: "Can I use a GIF on my website?", a: "Yes, GIFs work on every website and email client. However, for website animations consider using MP4 with autoplay, muted, and loop attributes instead — it loads 95% faster and looks much better, especially on mobile." },
  { q: "What is the maximum GIF duration recommended?", a: "Keep GIFs under 5 seconds for messaging apps (WhatsApp, Telegram, Slack) which often have size limits of 5–25 MB. For longer animations, trim the video to 3–5 seconds and use 10 fps at 480px wide." },
];

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

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from("conversions")
            .select("progress, status")
            .eq("id", record?.id)
            .single();
          if (data && data.status === "converting") {
            setProgress(Math.max(50, data.progress ?? 50));
          }
        } catch { /* ignore */ }
      }, 3000);

      const { data: result, error } = await supabase.functions.invoke("process-conversion", {
        body: {
          conversionId: record?.id,
          inputPath: path,
          outputFormat: "gif",
          settings: { fps, colors, quality, trimStart, trimEnd, width },
        },
      });

      clearInterval(pollInterval);

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

  const outputFilename = file ? `${file.name.replace(/\.[^.]+$/, "")}.gif` : "output.gif";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${SITE_URL}/video-to-gif`} />
        <meta name="robots" content="index, follow" />
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/video-to-gif`} />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta property="og:image" content={OG_IMAGE} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={OG_IMAGE} />
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Video to GIF Converter",
          "url": `${SITE_URL}/video-to-gif`,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": pageDesc,
          "featureList": [
            "Custom FPS control (5, 10, 15, 24 fps)",
            "Color palette selection (64, 128, 256 colors)",
            "Trim video to exact start and end seconds",
            "Resize GIF by max width",
            "Quality slider for file size control",
            "MP4, MOV, MKV, AVI, WebM to GIF",
            "Free, no registration required",
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Convert a Video to GIF Online",
          "description": "Turn any video file into an animated GIF in five simple steps using VideoConvert Pro.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Upload your video", "text": "Drag and drop your video file onto the upload zone, or click to browse. Supports MP4, MOV, MKV, AVI, WebM, FLV, and more." },
            { "@type": "HowToStep", "position": 2, "name": "Set frame rate", "text": "Choose FPS (frames per second). 10 fps is recommended for most GIFs. Lower FPS creates smaller files; higher FPS creates smoother motion." },
            { "@type": "HowToStep", "position": 3, "name": "Choose color palette", "text": "Select 64, 128, or 256 colors. More colors produce better quality but larger files. 128 colors is a balanced choice." },
            { "@type": "HowToStep", "position": 4, "name": "Optionally trim and resize", "text": "Enter start and end trim times in seconds to clip a specific segment. Set a maximum width in pixels to scale the GIF down." },
            { "@type": "HowToStep", "position": 5, "name": "Convert and download", "text": "Click Convert to GIF. Preview the animated GIF on screen, then click Download GIF to save it to your device." },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Video Tools", "item": `${SITE_URL}/video-to-gif` },
            { "@type": "ListItem", "position": 3, "name": "Video to GIF Converter", "item": `${SITE_URL}/video-to-gif` },
          ],
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-14">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Video to <span className="text-gradient">GIF</span> Converter
          </h1>
          <p className="text-muted-foreground text-lg">Convert any video to a high-quality animated GIF — free, no registration, no watermark.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-2xl mx-auto px-4 space-y-5">

          {/* Upload zone */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <UploadZone onFilesSelected={handleFiles} multiple={false} />
            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {/* Settings */}
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
                      ].map(f => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}
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
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Quality — {quality}%</Label>
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
                  <img src={outputUrl} alt="Animated GIF preview" className="max-w-full rounded-xl mx-auto mb-4 max-h-60 object-contain" />
                  <Button
                    className="gradient-primary border-0 text-white gap-2"
                    onClick={() => triggerDownload(outputUrl, outputFilename)}
                  >
                    <Download className="w-4 h-4" /> Download GIF
                  </Button>
                  <div className="mt-2">
                    <a href={outputUrl} download={outputFilename} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                      Save link as…
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── How It Works ── */}
          <section aria-labelledby="how-to-gif-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="how-to-gif-heading" className="font-bold text-lg mb-5">How to Convert Video to GIF — Step by Step</h2>
            <ol className="space-y-4">
              {[
                { icon: Upload, step: "1", title: "Upload your video file", desc: "Drag and drop MP4, MOV, MKV, AVI, WebM, or any supported format onto the upload zone. Files up to 500 MB are accepted." },
                { icon: Settings, step: "2", title: "Configure GIF settings", desc: "Set frame rate (10 fps recommended), choose a colour palette (128 for balanced quality), and adjust quality with the slider." },
                { icon: ImageIcon, step: "3", title: "Trim and resize (optional)", desc: "Enter start and end times in seconds to extract a specific clip. Set max width in pixels to reduce the output file size." },
                { icon: Zap, step: "4", title: "Click Convert to GIF", desc: "Our server processes the video using FFmpeg with a two-pass palette generation for optimal colour accuracy." },
                { icon: CheckCircle, step: "5", title: "Preview and download", desc: "Preview the animated GIF directly on the page. Click Download GIF or right-click → Save link as to save it to your device." },
              ].map(({ icon: Icon, step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Step {step}: {title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── GIF Settings Guide Table ── */}
          <section aria-labelledby="gif-settings-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="gif-settings-heading" className="font-bold text-lg mb-4">GIF Settings Reference</h2>
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
          </section>

          {/* ── GIF vs WebP vs MP4 Comparison ── */}
          <section aria-labelledby="format-comparison-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="format-comparison-heading" className="font-bold text-lg mb-4">GIF vs WebP vs MP4 — Which Format Should You Use?</h2>
            <p className="text-sm text-muted-foreground mb-4">Each animated format has distinct trade-offs in browser support, file size, and use cases.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-3 font-semibold">Feature</th>
                    <th className="text-left pb-3 font-semibold text-primary">GIF</th>
                    <th className="text-left pb-3 font-semibold">WebP</th>
                    <th className="text-left pb-3 font-semibold">MP4 (H.264)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {[
                    { feature: "Browser support", gif: "Universal (100%)", webp: "95%+ modern browsers", mp4: "Universal (100%)" },
                    { feature: "Email support", gif: "✅ All clients", webp: "❌ Limited", mp4: "❌ Not supported" },
                    { feature: "File size (10s clip)", gif: "~15–40 MB", webp: "~3–8 MB", mp4: "~1–3 MB" },
                    { feature: "Audio support", gif: "❌ None", webp: "❌ None", mp4: "✅ Yes" },
                    { feature: "Alpha transparency", gif: "1-bit only", webp: "✅ Full alpha", mp4: "❌ None" },
                    { feature: "Best use case", gif: "Email, README, messaging", webp: "Web stickers, thumbnails", mp4: "Web, social media, video" },
                  ].map(row => (
                    <tr key={row.feature} className="hover:bg-muted/30">
                      <td className="py-2.5 font-semibold text-xs">{row.feature}</td>
                      <td className="py-2.5 text-muted-foreground">{row.gif}</td>
                      <td className="py-2.5 text-muted-foreground">{row.webp}</td>
                      <td className="py-2.5 text-muted-foreground">{row.mp4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              <strong>Recommendation:</strong> Use GIF for email newsletters and GitHub README files where native image display is required. Use MP4 with <code className="bg-muted px-1 rounded">autoplay muted loop</code> for website animations — it is 95% smaller and looks noticeably better on Retina and OLED displays.
            </p>
          </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-gif-heading">
            <h2 id="faq-gif-heading" className="font-bold text-xl mb-4">Frequently Asked Questions</h2>
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
          <nav aria-label="Related video tools">
            <h2 className="font-bold text-lg mb-3">Related Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: "/youtube-to-short", label: "YouTube to Short" },
                { href: "/video-compressor", label: "Video Compressor" },
                { href: "/youtube-downloader", label: "YouTube Downloader" },
                { href: "/mp4-converter", label: "MP4 Converter" },
                { href: "/webm-converter", label: "WebM Converter" },
                { href: "/mov-converter", label: "MOV Converter" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-sm font-medium"
                >
                  <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
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

export default VideoToGIF;
