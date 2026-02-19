import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
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
import { Video, Zap, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const FEATURES = [
  { icon: Video, title: "Convert Any Video", desc: "Support 60+ formats including MP4, MKV, MOV, AVI, WebM and more." },
  { icon: Zap, title: "Lightning Fast", desc: "Cloud-powered FFmpeg processing for ultra-fast conversions." },
  { icon: Shield, title: "Free & Secure", desc: "Files are automatically deleted after 24 hours. No registration required." },
  { icon: Star, title: "Best Quality", desc: "Preserve original quality or optimize with custom bitrate settings." },
];

const Index = () => {
  const { user } = useAuth();
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [converting, setConverting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleApplyPreset = useCallback((preset: Preset) => {
    setActivePreset(preset.label);
    setOutputFormat(preset.format);
    setSettings(prev => ({ ...prev, ...preset.settings }));
    toast.success(`Preset applied: ${preset.label}`);
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
        // Upload phase
        updateJob(job.id, { status: "uploading", progress: 10 });

        const ext = job.file.name.split(".").pop() || "mp4";
        const path = `${user?.id || "guest"}/${job.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("video-uploads")
          .upload(path, job.file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        updateJob(job.id, { progress: 40 });

        // Insert DB record
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

        // Call edge function
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
    if (job.outputUrl) {
      const a = document.createElement("a");
      a.href = job.outputUrl;
      a.download = job.filename.replace(/\.[^.]+$/, "") + "." + job.outputFormat;
      a.click();
    }
  };

  const handleRemove = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const pendingCount = jobs.filter(j => j.status === "pending").length;

  return (
    <>
      <Helmet>
        <title>Free Online Video Converter — Convert MP4, MKV, MOV & 60+ Formats | VideoConvert Pro</title>
        <meta name="description" content="Convert any video format online for free. MP4, MKV, MOV, AVI, WebM and 60+ formats supported. Fast, secure, no registration required." />
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
            <QuickPresets activePreset={activePreset} onApply={handleApplyPreset} />
            <UploadZone onFilesSelected={handleFilesSelected} />

            {jobs.length > 0 && (
              <div className="mt-6">
                <ConversionQueue jobs={jobs} onRemove={handleRemove} onDownload={handleDownload} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-6 items-end" onClick={() => setActivePreset(null)}>
              <FormatSelector value={outputFormat} onChange={setOutputFormat} />
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
              <AdvancedSettings settings={settings} onChange={(s) => { setSettings(s); setActivePreset(null); }} />
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
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
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
