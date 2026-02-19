import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import UploadZone from "@/components/UploadZone";
import FormatSelector from "@/components/FormatSelector";
import AdvancedSettings, { ConversionSettings, defaultSettings } from "@/components/AdvancedSettings";
import ConversionQueue, { ConversionJob } from "@/components/ConversionQueue";
import ConverterGrid from "@/components/ConverterGrid";
import TrustSection from "@/components/TrustSection";
import QuickPresets, { Preset } from "@/components/QuickPresets";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Video, Zap, Shield, Star, Upload, Settings, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { CONVERTER_GRID_FORMATS } from "@/lib/constants";

const SITE_URL = "https://videoconvert.pro";

const FEATURES = [
  { icon: Video, title: "Convert Any Video", desc: "Support 60+ formats including MP4, MKV, MOV, AVI, WebM and more." },
  { icon: Zap, title: "Lightning Fast", desc: "Cloud-powered FFmpeg processing for ultra-fast conversions." },
  { icon: Shield, title: "Free & Secure", desc: "Files are automatically deleted after 24 hours. No registration required." },
  { icon: Star, title: "Best Quality", desc: "Preserve original quality or optimize with custom bitrate settings." },
];

const HOW_IT_WORKS = [
  { icon: Upload, step: "1", title: "Upload Your Video", desc: "Drag & drop or click to select any video file. Supports MP4, MKV, MOV, AVI, WebM and 60+ formats up to 2 GB." },
  { icon: Zap, step: "2", title: "Choose a Preset or Format", desc: "Pick a Quick Preset (TikTok, YouTube, iPhone…) or select your output format manually. Customize codec, resolution, and bitrate if needed." },
  { icon: Settings, step: "3", title: "Adjust Advanced Settings", desc: "Fine-tune video codec (H.264, H.265, VP9), audio codec (AAC, MP3), frame rate, bitrate, rotate, and flip — all optional." },
  { icon: Download, step: "4", title: "Download Instantly", desc: "Click Convert and download your file the moment it's ready. No watermarks, no limits, no email required." },
];

const HOME_FAQS = [
  {
    q: "Is VideoConvert Pro really free?",
    a: "Yes — 100% free with no hidden costs. You can convert videos without creating an account. Sign up to unlock larger file sizes and conversion history.",
  },
  {
    q: "What video formats are supported?",
    a: "We support 60+ formats including MP4, MKV, MOV, AVI, WebM, FLV, WMV, GIF, 3GP, MPEG, M4V, TS, VOB, OGV, and many more. Output to any format you need.",
  },
  {
    q: "How long does video conversion take?",
    a: "Most conversions finish in 30–90 seconds depending on file size and output settings. Our cloud-powered FFmpeg engine processes your video as fast as possible.",
  },
  {
    q: "Is my video kept private and secure?",
    a: "Absolutely. All uploads are encrypted in transit (HTTPS). Your video files are automatically deleted from our servers within 24 hours. We never share your files.",
  },
  {
    q: "What is the maximum file size I can upload?",
    a: "Guest users can upload files up to 500 MB. Free registered users get up to 2 GB per file. Larger limits are available on paid plans.",
  },
  {
    q: "Do I need to create an account to convert videos?",
    a: "No account is required. Just upload, convert, and download — completely free. Create a free account to access conversion history and higher file size limits.",
  },
  {
    q: "How do I convert a video to MP4?",
    a: "Upload your video (any format), select MP4 as the output format, optionally apply the 'MP4 HD' quick preset, and click Convert. Your MP4 will be ready in seconds.",
  },
  {
    q: "Will I lose quality during conversion?",
    a: "Converting between codecs involves some re-encoding, but choosing 'Copy (No Re-encode)' for video or audio tracks avoids quality loss. Our H.264 and H.265 encoders produce excellent results at default settings.",
  },
];

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VideoConvert Pro",
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Convert MP4, MKV, MOV, AVI, WebM and 60+ video formats",
    "YouTube to Short Video Clipper",
    "Video to GIF Converter",
    "Video Compressor",
    "YouTube Video Downloader",
    "AI Highlight Detection",
    "No registration required",
    "Files deleted after 24 hours",
    "Supports H.264, H.265, VP9, AV1 codecs",
    "Custom bitrate, resolution, and frame rate controls",
  ],
  description: "Free online video converter supporting 60+ formats. Convert MP4, MKV, MOV, AVI, WebM and more. Fast, secure, no registration required.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const Index = () => {
  const { user } = useAuth();
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [converting, setConverting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleApplyPreset = useCallback((preset: Preset) => {
    const isDeactivating = activePreset === preset.label;
    if (isDeactivating) {
      setActivePreset(null);
      toast(`Preset "${preset.label}" deselected`);
      return;
    }
    setActivePreset(preset.label);
    setOutputFormat(preset.format);
    setSettings(s => ({ ...s, ...preset.settings }));
    toast.success(`✓ ${preset.label} preset applied`);
  }, [activePreset]);

  const handleFormatChange = useCallback((fmt: string) => {
    setOutputFormat(fmt);
    setActivePreset(null);
  }, []);

  const handleSettingsChange = useCallback((s: ConversionSettings) => {
    setSettings(s);
    setActivePreset(null);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<ConversionJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newJobs: ConversionJob[] = files.map(file => ({
      id: uuidv4(),
      file,
      filename: file.name,
      outputFormat,
      status: "pending",
      progress: 0,
      fileSize: file.size,
    }));
    setJobs(prev => [...prev, ...newJobs]);
  }, [outputFormat]);

  const handleConvert = async () => {
    const pendingJobs = jobs.filter(j => j.status === "pending");
    if (pendingJobs.length === 0) return;

    setConverting(true);

    for (const job of pendingJobs) {
      if (!job.file) continue;

      try {
        updateJob(job.id, { status: "uploading", progress: 10 });

        const ext = job.file.name.split(".").pop() || "mp4";
        const path = `${user?.id || "guest"}/${job.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("video-uploads")
          .upload(path, job.file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        updateJob(job.id, { progress: 40 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertData: any = {
          user_id: user?.id || null,
          input_filename: job.file.name,
          input_format: ext,
          output_format: outputFormat,
          status: "converting",
          input_path: path,
          file_size: job.file.size,
          settings: settings as unknown as Record<string, unknown>,
        };
        const { data: record, error: dbError } = await supabase
          .from("conversions")
          .insert(insertData)
          .select()
          .single();

        if (dbError) throw new Error(dbError.message);

        updateJob(job.id, { status: "converting", progress: 50 });

        const { data: result, error: fnError } = await supabase.functions.invoke("process-conversion", {
          body: {
            conversionId: record.id,
            inputPath: path,
            outputFormat,
            settings,
          },
        });

        if (fnError) throw new Error(fnError.message);

        if (result?.outputPath) {
          const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
          updateJob(job.id, { status: "ready", progress: 100, outputUrl: urlData.publicUrl });
        } else {
          throw new Error(result?.error || "Conversion failed");
        }

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Conversion failed";
        updateJob(job.id, { status: "failed", error: message });
        toast.error(`Failed: ${job.filename} — ${message}`);
      }
    }

    setConverting(false);
    toast.success("Conversion complete!");
  };

  const handleDownload = (job: ConversionJob) => {
    if (!job.outputUrl) return;
    const a = document.createElement("a");
    a.href = job.outputUrl;
    a.download = job.filename.replace(/\.[^.]+$/, "") + "." + job.outputFormat;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemove = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const pendingCount = jobs.filter(j => j.status === "pending").length;

  return (
    <>
      <Helmet>
        <title>Free Online Video Converter — Convert MP4, MKV, MOV & 60+ Formats | VideoConvert Pro</title>
        <meta name="description" content="Convert any video format online for free. MP4, MKV, MOV, AVI, WebM and 60+ formats supported. Fast, secure, no registration required. Download instantly." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="Free Online Video Converter — 60+ Formats | VideoConvert Pro" />
        <meta property="og:description" content="Convert any video to MP4, MKV, MOV, AVI, WebM and 60+ formats. Free, fast, and secure. No registration needed." />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Online Video Converter — 60+ Formats | VideoConvert Pro" />
        <meta name="twitter:description" content="Convert any video to MP4, MKV, MOV, AVI, WebM and 60+ formats. Free, fast, and secure." />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(webApplicationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero py-16">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> 60+ formats · Free · No signup needed
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Online{" "}
            <span className="text-gradient">Video Converter</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Convert any video to MP4, MKV, MOV, AVI, WebM and 60+ other formats. Fast, free, and secure.
          </p>

          {/* Main converter card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 md:p-8 text-left">
            <QuickPresets
              activePreset={activePreset}
              onApply={handleApplyPreset}
              onClear={() => { setActivePreset(null); }}
            />
            <UploadZone onFilesSelected={handleFilesSelected} />

            {jobs.length > 0 && (
              <div className="mt-6">
                <ConversionQueue jobs={jobs} onRemove={handleRemove} onDownload={handleDownload} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6 items-end">
              <FormatSelector value={outputFormat} onChange={handleFormatChange} />
              <Button
                size="lg"
                className="gradient-primary border-0 text-white h-12 px-8 text-base font-semibold shrink-0"
                onClick={handleConvert}
                disabled={converting || pendingCount === 0}
              >
                {converting ? "Converting..." : `Convert ${pendingCount > 1 ? `${pendingCount} Files` : "File"}`}
              </Button>
            </div>

            <div className="mt-4">
              <AdvancedSettings settings={settings} onChange={handleSettingsChange} />
            </div>
          </div>

          {!user && (
            <div className="mt-6 p-4 bg-accent rounded-xl flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                🔓 Sign up free to get larger file limits and conversion history
              </span>
              <Button size="sm" className="gradient-primary border-0 text-white shrink-0" asChild>
                <Link to="/signup">Sign Up Free</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="flex flex-col gap-3 p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-accent/30">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">How to Convert a Video Online</h2>
          <p className="text-muted-foreground text-center text-sm mb-10 max-w-xl mx-auto">
            Four simple steps — no software to install, no account required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative flex flex-col gap-3 p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-white text-sm font-bold shrink-0">
                    {step.step}
                  </span>
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats A–Z */}
      <section className="py-12 bg-background border-t border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-2">All Supported Video Formats</h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Click any format to open the dedicated converter with format-specific presets and FAQs.
          </p>
          <nav aria-label="Supported video formats">
            <div className="flex flex-wrap gap-2 justify-center">
              {CONVERTER_GRID_FORMATS.map(fmt => (
                <Link
                  key={fmt}
                  to={`/${fmt.toLowerCase()}-converter`}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-mono font-semibold text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150"
                >
                  {fmt}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-accent/20">
        <div className="container max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-center text-sm mb-10">
            Everything you need to know about VideoConvert Pro.
          </p>
          <div className="space-y-4">
            {HOME_FAQS.map(({ q, a }) => (
              <div key={q} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-2 text-foreground flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConverterGrid />
      <TrustSection />
    </>
  );
};

export default Index;
