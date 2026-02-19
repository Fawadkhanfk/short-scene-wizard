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
import { Download, Loader2, HardDrive } from "lucide-react";
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

      const { data: result, error } = await supabase.functions.invoke("process-conversion", {
        body: {
          conversionId: record?.id,
          inputPath: path,
          outputFormat: ext,
          settings: { compress: true, quality, targetSizeMB, resolution },
        },
      });

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

  const pageTitle = "Free Online Video Compressor — Reduce Video File Size | VideoConvert Pro";
  const pageDesc = "Compress MP4, MOV, MKV, and AVI videos online. Reduce file size by up to 90% with quality control or target size mode. Free, no registration, no watermark.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${SITE_URL}/video-compressor`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/video-compressor`} />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Video Compressor",
          "url": `${SITE_URL}/video-compressor`,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": pageDesc,
          "featureList": ["Quality % mode", "Target size mode", "Resolution downscaling", "MP4 MP4 MKV MOV AVI support", "No watermark"],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "How much can I reduce video file size?", "acceptedAnswer": { "@type": "Answer", "text": "Depending on the source video, you can reduce file size by 50–90% using H.264 compression. A 100MB video can often be compressed to 10–30MB with acceptable quality." } },
            { "@type": "Question", "name": "Will compressing reduce video quality?", "acceptedAnswer": { "@type": "Answer", "text": "Some quality reduction is expected. At 75% quality setting most viewers cannot distinguish from the original. Below 50% quality, artifacts become visible." } },
            { "@type": "Question", "name": "What video formats can I compress?", "acceptedAnswer": { "@type": "Answer", "text": "You can compress MP4, MOV, MKV, AVI, WebM, and most other video formats. The output is always in the same format as the input." } },
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
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <UploadZone onFilesSelected={handleFiles} multiple={false} />
            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="w-4 h-4 text-primary" />
                {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            )}
          </div>

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
                    onClick={() => triggerDownload(outputUrl, "compressed." + (file.name.split(".").pop() || "mp4"))}
                  >
                    <Download className="w-4 h-4" /> Download Compressed Video
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Compression Guide */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Video Compression Guide</h2>
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
                    { q: "90%", r: "10–20% smaller", u: "Near-lossless, archiving" },
                    { q: "75%", r: "40–60% smaller", u: "Sharing, streaming (recommended)" },
                    { q: "50%", r: "60–75% smaller", u: "Email, messaging apps" },
                    { q: "25%", r: "75–85% smaller", u: "Previews, thumbnails" },
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
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-bold text-lg mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                { q: "How does video compression work?", a: "Video compression removes redundant data between frames. H.264 codec analyzes differences between frames and only stores changes, dramatically reducing file size while preserving perceived quality." },
                { q: "What's the best quality setting for sharing on WhatsApp?", a: "WhatsApp limits video to 16MB. Use 75% quality and 720p resolution, then compress until the file meets the limit. Most videos compress to well under 16MB." },
                { q: "Will my video lose quality permanently?", a: "Compression is lossy — some quality is lost. However, at 75% quality, most viewers can't tell the difference. Keep your original file as a backup before compressing." },
                { q: "What is the maximum file size I can upload?", a: "Free users can upload up to 500MB. Sign up for higher limits and batch compression." },
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

export default VideoCompressor;
