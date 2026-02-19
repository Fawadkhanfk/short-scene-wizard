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
import { FORMAT_DESCRIPTIONS, VIDEO_FORMATS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const FORMAT_FAQS: Record<string, { q: string; a: string }[]> = {
  default: [
    { q: "Is this converter free?", a: "Yes, VideoConvert Pro is completely free to use with no registration required." },
    { q: "How long are files stored?", a: "All uploaded and converted files are automatically deleted after 24 hours." },
    { q: "What is the maximum file size?", a: "Free users can upload files up to 500MB. Sign up for higher limits." },
  ],
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
    desc: `Convert ${formatKey} videos online for free.`,
    ext: formatKey.toLowerCase(),
  };

  const popularConversions = VIDEO_FORMATS
    .filter(f => f !== formatKey)
    .slice(0, 8)
    .map(f => ({ from: formatKey, to: f }));

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
        const { data: result, error } = await supabase.functions.invoke("process-conversion", {
          body: { conversionId: record?.id, inputPath: path, outputFormat, settings },
        });
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

  return (
    <>
      <Helmet>
        <title>{formatInfo.title} — Free Online {formatKey} Converter | VideoConvert Pro</title>
        <meta name="description" content={`${formatInfo.desc} Fast, free, no registration required.`} />
      </Helmet>

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/" className="hover:text-foreground">Video Converter</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{formatKey} Converter</span>
        </div>
      </div>

      <section className="gradient-hero py-12">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">{formatKey}</span> Converter
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{formatInfo.desc}</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            <UploadZone onFilesSelected={handleFilesSelected} />
            {jobs.length > 0 && <div className="mt-5"><ConversionQueue jobs={jobs} onRemove={id => setJobs(p => p.filter(j => j.id !== id))} onDownload={job => job.outputUrl && window.open(job.outputUrl)} /></div>}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 items-end">
              <FormatSelector value={outputFormat} onChange={setOutputFormat} />
              <Button size="lg" className="gradient-primary border-0 text-white h-12 px-8 shrink-0" onClick={handleConvert} disabled={converting || !jobs.filter(j => j.status === "pending").length}>
                {converting ? "Converting..." : "Convert"}
              </Button>
            </div>
            <div className="mt-4"><AdvancedSettings settings={settings} onChange={setSettings} /></div>
          </div>

          {/* Popular conversions */}
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-4">Popular {formatKey} Conversions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularConversions.slice(0, 8).map(c => (
                <Link key={c.to} to={`/${c.from.toLowerCase()}-to-${c.to.toLowerCase()}`}
                  className="p-3 rounded-xl border border-border hover:border-primary hover:bg-accent text-sm text-center transition-all">
                  <span className="font-mono font-bold text-primary">{c.from}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="font-mono font-bold text-primary">{c.to}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {(FORMAT_FAQS[formatKey] || FORMAT_FAQS.default).map(faq => (
                <div key={faq.q} className="bg-card border border-border rounded-xl p-5">
                  <p className="font-semibold text-sm mb-1">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <TrustSection />
    </>
  );
};

export default FormatConverter;
