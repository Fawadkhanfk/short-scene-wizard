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
import { Download, Loader2, HardDrive, Upload, Settings, Zap, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

const SITE_URL = "https://videoconvert.pro";
const OG_IMAGE = `${SITE_URL}/og-video-compressor.jpg`;

const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const pageTitle = "Free Online Video Compressor — Reduce Video File Size Up to 90% | VideoConvert Pro";
const pageDesc = "Compress MP4, MOV, MKV, and AVI videos online. Reduce file size by up to 90% with quality control or target size mode. Free, no registration, no watermark.";

const faqItems = [
  { q: "How does video compression work?", a: "Video compression removes redundant data between frames using codecs like H.264. The encoder analyses differences between consecutive frames and only stores changes, rather than complete frames — dramatically reducing file size while preserving perceived quality." },
  { q: "What's the best quality setting for sharing on WhatsApp?", a: "WhatsApp limits video to 16 MB. Set quality to 75% and resolution to 720p, then compress. Most videos of a few minutes will come in well under 16 MB. If still too large, try 50% quality." },
  { q: "Will my video lose quality permanently?", a: "Compression is lossy — some data is discarded during encoding. At 75% quality, most viewers cannot detect a difference from the original. Always keep a copy of the original file before compressing." },
  { q: "What is the maximum file size I can upload?", a: "Free users can upload up to 500 MB. Sign up for higher file size limits and batch compression of multiple videos at once." },
  { q: "Can I compress a 4K video?", a: "Yes. Upload your 4K (3840×2160) video and set Resolution to 1080p. This alone typically reduces file size by 70–80% before any quality compression is applied. 1080p is sufficient for most web and social media use cases." },
  { q: "Does compression affect audio quality?", a: "Slightly. The output uses AAC audio at 128 kbps by default, which is transparent for speech and music at normal listening volume. If audio quality is critical, use the 90% quality setting to preserve higher audio bitrate." },
  { q: "What's the best setting for emailing a video?", a: "Most email services limit attachments to 10–25 MB. Use 50% quality with 720p resolution. A typical 2-minute video at 1080p compresses to under 15 MB at 50% quality, making it safe to email." },
  { q: "Can I compress a video without losing quality?", a: "True lossless compression is not possible with H.264, but you can use 90% quality to achieve near-lossless results with 10–20% file size reduction. For heavier compression without visible quality loss, 75% quality is recommended." },
];

const VideoCompressor = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"quality" | "size">("quality");
  const [quality, setQuality] = useState(75);
  const [targetSizeMB, setTargetSizeMB] = useState("");
  const [resolution, setResolution] = useState("keep");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    setFile(files[0]);
    setOutputUrl(null);
  }, []);

  const estimatedSize = file && mode === "quality"
    ? ((file.size / 1024 / 1024) * (quality / 100) * 0.7).toFixed(1)
    : targetSizeMB || "?";

  const handleCompress = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(10);

    try {
      const id = uuidv4();
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user?.id || "guest"}/${id}.${ext}`;

      await supabase.storage.from("video-uploads").upload(path, file, { upsert: true });
      setProgress(40);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        user_id: user?.id || null,
        input_filename: file.name,
        input_format: ext,
        output_format: ext,
        status: "converting",
        input_path: path,
        file_size: file.size,
        settings: { compress: true, quality, targetSizeMB, resolution },
      };

      const { data: record } = await supabase
        .from("conversions")
        .insert(insertData)
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
          outputFormat: ext,
          settings: { compress: true, quality, targetSizeMB, resolution },
        },
      });

      clearInterval(pollInterval);

      if (error) throw error;
      setProgress(100);

      if (result?.outputPath) {
        const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
        setOutputUrl(urlData.publicUrl);
        toast.success("Video compressed!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Compression failed");
    } finally {
      setConverting(false);
    }
  };

  const outputFilename = file ? `compressed.${file.name.split(".").pop() || "mp4"}` : "compressed.mp4";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${SITE_URL}/video-compressor`} />
        <meta name="robots" content="index, follow" />
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/video-compressor`} />
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
          "name": "Video Compressor",
          "url": `${SITE_URL}/video-compressor`,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": pageDesc,
          "featureList": [
            "Quality % compression mode",
            "Target file size mode",
            "Resolution downscaling (1080p, 720p, 480p)",
            "MP4, MOV, MKV, AVI, WebM support",
            "Estimated output size preview",
            "No watermark added",
            "Free, no registration required",
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Compress a Video Online",
          "description": "Reduce your video file size in four steps using VideoConvert Pro's free online video compressor.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Upload your video", "text": "Drag and drop your MP4, MOV, MKV, AVI, or WebM file onto the upload zone. Files up to 500 MB are supported." },
            { "@type": "HowToStep", "position": 2, "name": "Choose compression mode", "text": "Select Quality % to control output quality directly (75% is recommended), or select Target Size to specify a maximum output file size in MB." },
            { "@type": "HowToStep", "position": 3, "name": "Set resolution", "text": "Keep the original resolution, or downscale to 1080p, 720p, or 480p. Reducing resolution from 4K to 1080p alone reduces file size by 70–80%." },
            { "@type": "HowToStep", "position": 4, "name": "Compress and download", "text": "Click Compress Video. Processing takes under a minute. Download the compressed file and verify size savings in the estimated output preview." },
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
            { "@type": "ListItem", "position": 2, "name": "Video Tools", "item": `${SITE_URL}/video-compressor` },
            { "@type": "ListItem", "position": 3, "name": "Video Compressor", "item": `${SITE_URL}/video-compressor` },
          ],
        })}</script>
      </Helmet>

      <section className="gradient-hero py-14">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Free Online <span className="text-gradient">Video Compressor</span>
          </h1>
          <p className="text-muted-foreground text-lg">Reduce video file size by up to 90% — free, no registration, no watermark.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-2xl mx-auto px-4 space-y-5">

          {/* Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <UploadZone onFilesSelected={handleFiles} multiple={false} />
            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="w-4 h-4 text-primary" />
                {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            )}
          </div>

          {/* Settings */}
          {file && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-semibold">Compression Settings</h2>

              {/* Mode toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setMode("quality")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "quality" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  Quality %
                </button>
                <button
                  onClick={() => setMode("size")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === "size" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  Target Size
                </button>
              </div>

              {mode === "quality" ? (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    Quality — {quality}%
                  </Label>
                  <Slider min={10} max={100} step={5} value={[quality]} onValueChange={([v]) => setQuality(v)} />
                  <p className="text-xs text-muted-foreground mt-1.5">Higher = better quality, larger file. 75% is recommended for most uses.</p>
                </div>
              ) : (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Target File Size (MB)</Label>
                  <Input placeholder="e.g. 10" value={targetSizeMB} onChange={e => setTargetSizeMB(e.target.value)} />
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep Original</SelectItem>
                    <SelectItem value="1920x1080">1080p — Best quality</SelectItem>
                    <SelectItem value="1280x720">720p — Good balance</SelectItem>
                    <SelectItem value="854x480">480p — Smaller file</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original size:</span>
                  <span className="font-semibold">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Estimated output:</span>
                  <span className="font-semibold text-success">~{estimatedSize} MB</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gradient-primary border-0 text-white h-12"
                onClick={handleCompress}
                disabled={converting}
              >
                {converting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <HardDrive className="w-4 h-4 mr-2" />}
                {converting ? "Compressing..." : "Compress Video"}
              </Button>

              {converting && <Progress value={progress} />}

              {outputUrl && (
                <div className="text-center pt-2 animate-fade-in">
                  <p className="text-success font-semibold mb-3">✓ Video compressed successfully!</p>
                  <Button
                    className="gradient-primary border-0 text-white gap-2"
                    onClick={() => triggerDownload(outputUrl, outputFilename)}
                  >
                    <Download className="w-4 h-4" /> Download Compressed Video
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

          {/* ── How to Compress a Video ── */}
          <section aria-labelledby="how-to-compress-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="how-to-compress-heading" className="font-bold text-lg mb-5">How to Compress a Video — Step by Step</h2>
            <ol className="space-y-4">
              {[
                { icon: Upload, step: "1", title: "Upload your video", desc: "Drag and drop MP4, MOV, MKV, AVI, or WebM files up to 500 MB. The file name and original size are displayed immediately." },
                { icon: Settings, step: "2", title: "Choose your compression mode", desc: "Quality % mode lets you set a quality percentage (75% recommended). Target Size mode lets you specify a maximum output size in MB." },
                { icon: Zap, step: "3", title: "Set resolution (optional)", desc: "Downscaling from 4K to 1080p reduces file size by 70–80% before quality compression. 720p is ideal for social media sharing." },
                { icon: CheckCircle, step: "4", title: "Download compressed video", desc: "Click Compress Video. Processing completes in under a minute. Download your smaller video file, ready to share or upload." },
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

          {/* ── Compression Guide Table ── */}
          <section aria-labelledby="compression-guide-heading" className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 id="compression-guide-heading" className="font-bold text-lg mb-4">Video Compression Quality Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-3 font-semibold">Quality Setting</th>
                    <th className="text-left pb-3 font-semibold">File Size Reduction</th>
                    <th className="text-left pb-3 font-semibold">Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { q: "90%", r: "10–20% smaller", u: "Near-lossless, archiving, master copies" },
                    { q: "75%", r: "40–60% smaller", u: "Sharing, streaming, social media (recommended)" },
                    { q: "50%", r: "60–75% smaller", u: "Email (WhatsApp 16 MB limit), messaging apps" },
                    { q: "25%", r: "75–85% smaller", u: "Previews, thumbnails, very small file required" },
                  ].map(row => (
                    <tr key={row.q} className="hover:bg-muted/30">
                      <td className="py-2.5 font-mono text-primary font-semibold text-xs">{row.q}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.r}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.u}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-compressor-heading">
            <h2 id="faq-compressor-heading" className="font-bold text-xl mb-4">Frequently Asked Questions</h2>
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
                { href: "/mp4-converter", label: "MP4 Converter" },
                { href: "/video-to-gif", label: "Video to GIF" },
                { href: "/youtube-to-short", label: "YouTube to Short" },
                { href: "/youtube-downloader", label: "YouTube Downloader" },
                { href: "/mkv-converter", label: "MKV Converter" },
                { href: "/mov-converter", label: "MOV Converter" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-sm font-medium"
                >
                  <HardDrive className="w-3.5 h-3.5 text-primary shrink-0" />
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

export default VideoCompressor;
