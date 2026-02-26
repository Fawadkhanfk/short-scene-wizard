import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import UploadZone from "@/components/UploadZone";
import FormatSelector from "@/components/FormatSelector";
import AdvancedSettings, { defaultSettings, ConversionSettings } from "@/components/AdvancedSettings";
import ConversionQueue, { ConversionJob } from "@/components/ConversionQueue";
import TrustSection from "@/components/TrustSection";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { FORMAT_DESCRIPTIONS, FORMAT_FAQS, FORMAT_HOW_TO, VIDEO_FORMATS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
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

const FormatConverter = () => {
  const { format: formatSlug } = useParams<{ format: string }>();
  const { user } = useAuth();
  const [settings, setSettings] = React.useState<ConversionSettings>(defaultSettings);
  const [jobs, setJobs] = React.useState<ConversionJob[]>([]);
  const [converting, setConverting] = React.useState(false);
  const [outputFormat, setOutputFormat] = React.useState("mp4");

  const formatKey = formatSlug?.replace("-converter", "").toUpperCase() || "";
  const formatInfo = FORMAT_DESCRIPTIONS[formatKey] || {
    title: `${formatKey} Converter`,
    desc: `Convert ${formatKey} videos online for free. Fast, secure, no registration required.`,
    ext: formatKey.toLowerCase(),
    about: `${formatKey} is a video format supported by VideoConvert Pro. Upload your file and convert to MP4, MKV, MOV, and 60+ other formats.`,
    useCase: `Use our free online ${formatKey} converter to transform your videos into any supported format.`,
  };

  const canonicalUrl = `${SITE_URL}/${formatKey.toLowerCase()}-converter`;
  const pageTitle = `Free Online ${formatKey} Converter — Convert ${formatKey} Files Instantly | VideoConvert Pro`;
  const pageDesc = `${formatInfo.desc} Fast, free, no registration. Convert ${formatKey} to MP4, MKV, MOV, WebM, GIF and 60+ formats online.`;

  const popularConversions = VIDEO_FORMATS
    .filter(f => f !== formatKey)
    .slice(0, 8)
    .map(f => ({ from: formatKey, to: f }));

  const faqs = FORMAT_FAQS[formatKey] || FORMAT_FAQS.default;
  const howTo = FORMAT_HOW_TO[formatKey] || FORMAT_HOW_TO.default;

  const handleFilesSelected = (files: File[]) => {
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
  };

  const updateJob = (id: string, updates: Partial<ConversionJob>) =>
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));

  const handleConvert = async () => {
    const pending = jobs.filter(j => j.status === "pending");
    if (!pending.length) return;
    setConverting(true);
    for (const job of pending) {
      if (!job.file) continue;
      try {
        updateJob(job.id, { status: "uploading", progress: 10 });
        const ext = job.file.name.split(".").pop() || "mp4";
        const path = `${user?.id || "guest"}/${job.id}.${ext}`;
        await supabase.storage.from("video-uploads").upload(path, job.file, { upsert: true });
        updateJob(job.id, { progress: 40 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ins: any = { user_id: user?.id || null, input_filename: job.file.name, input_format: ext, output_format: outputFormat, status: "converting", input_path: path, file_size: job.file.size, settings: settings as unknown as Record<string, unknown> };
        const { data: record } = await supabase.from("conversions").insert(ins).select().single();
        updateJob(job.id, { status: "converting", progress: 50 });

        // Poll for progress updates
        const pollInterval = setInterval(async () => {
          try {
            const { data } = await supabase
              .from("conversions")
              .select("progress, status")
              .eq("id", record?.id)
              .single();
            if (data && data.status === "converting") {
              updateJob(job.id, { progress: Math.max(50, data.progress ?? 50) });
            }
          } catch { /* ignore */ }
        }, 3000);

        const { data: result, error } = await supabase.functions.invoke("process-conversion", {
          body: { conversionId: record?.id, inputPath: path, outputFormat, settings },
        });

        clearInterval(pollInterval);

        if (error) throw error;
        if (result?.outputPath) {
          const { data: urlData } = supabase.storage.from("video-outputs").getPublicUrl(result.outputPath);
          updateJob(job.id, { status: "ready", progress: 100, outputUrl: urlData.publicUrl });
        } else throw new Error(result?.error || "Failed");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed";
        updateJob(job.id, { status: "failed", error: msg });
        toast.error(msg);
      }
    }
    setConverting(false);
  };

  const handleDownload = (job: ConversionJob) => {
    if (!job.outputUrl) return;
    const filename = job.filename.replace(/\.[^.]+$/, "") + "." + job.outputFormat;
    triggerDownload(job.outputUrl, filename);
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="VideoConvert Pro" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": `${formatKey} Converter`,
          "url": canonicalUrl,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "description": pageDesc,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Convert ${formatKey} Video Files Online`,
          "description": `Step-by-step guide to converting ${formatKey} files using VideoConvert Pro`,
          "step": howTo.steps.map((text, i) => ({
            "@type": "HowToStep",
            "position": i + 1,
            "text": text,
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Video Converter", "item": SITE_URL },
            { "@type": "ListItem", "position": 3, "name": `${formatKey} Converter`, "item": canonicalUrl },
          ],
        })}</script>
      </Helmet>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-border bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/" className="hover:text-foreground">Video Converter</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{formatKey} Converter</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Free Online <span className="text-gradient">{formatKey}</span> Converter
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {formatInfo.desc} Convert {formatKey} to MP4, MKV, MOV, WebM, GIF and 60+ formats — fast, free, no registration.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Converter Tool */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <UploadZone onFilesSelected={handleFilesSelected} />
            {jobs.length > 0 && (
              <div className="mt-5">
                <ConversionQueue
                  jobs={jobs}
                  onRemove={id => setJobs(p => p.filter(j => j.id !== id))}
                  onDownload={handleDownload}
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 items-end">
              <FormatSelector value={outputFormat} onChange={setOutputFormat} />
              <Button
                size="lg"
                className="gradient-primary border-0 text-white h-12 px-8 shrink-0"
                onClick={handleConvert}
                disabled={converting || !jobs.filter(j => j.status === "pending").length}
              >
                {converting ? "Converting..." : "Convert"}
              </Button>
            </div>
            <div className="mt-4"><AdvancedSettings settings={settings} onChange={setSettings} /></div>
          </div>

          {/* How to Convert */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">How to Convert {formatKey} Files Online</h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {howTo.steps.map((step, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-card border border-border rounded-xl">
                  <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About the format */}
          {formatInfo.about && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-3">About the {formatKey} Format</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{formatInfo.about}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-3">When to Use {formatKey}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{formatInfo.useCase}</p>
              </div>
            </div>
          )}

          {/* Popular conversions */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Popular {formatKey} Conversions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularConversions.map(c => (
                <Link
                  key={c.to}
                  to={`/${c.from.toLowerCase()}-to-${c.to.toLowerCase()}`}
                  className="p-3 rounded-xl border border-border hover:border-primary hover:bg-accent text-sm text-center transition-all"
                >
                  <span className="font-mono font-bold text-primary">{c.from}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="font-mono font-bold text-primary">{c.to}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-6">Frequently Asked Questions — {formatKey} Converter</h2>
            <div className="space-y-4">
              {faqs.map(faq => (
                <div key={faq.q} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related tools */}
          <div className="mt-10 p-6 bg-accent rounded-2xl">
            <h2 className="font-bold mb-4">Related Free Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/youtube-to-short" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium">
                ✂️ YouTube to Short Clip
              </Link>
              <Link to="/video-to-gif" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium">
                🎭 Video to GIF Converter
              </Link>
              <Link to="/video-compressor" className="p-3 bg-card border border-border rounded-xl hover:border-primary transition-all text-sm font-medium">
                📦 Video Compressor
              </Link>
            </div>
          </div>
        </div>
      </section>
      <TrustSection />
    </>
  );
};

export default FormatConverter;
