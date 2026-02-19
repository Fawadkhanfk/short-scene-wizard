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

  return (
    <>
      <Helmet>
        <title>Video Compressor — Reduce Video File Size Online | VideoConvert Pro</title>
        <meta name="description" content="Compress any video online and reduce file size. Control quality or target a specific size. Free and fast." />
      </Helmet>

      <section className="gradient-hero py-14">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            <span className="text-gradient">Compress</span> Video
          </h1>
          <p className="text-muted-foreground">Reduce video file size without sacrificing quality</p>
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
              <h3 className="font-semibold">Compression Settings</h3>

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
                    <SelectItem value="1920x1080">1080p</SelectItem>
                    <SelectItem value="1280x720">720p</SelectItem>
                    <SelectItem value="854x480">480p</SelectItem>
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
                  <p className="text-success font-semibold mb-3">✓ Video compressed!</p>
                  <Button className="gradient-primary border-0 text-white gap-2" onClick={() => {
                    const a = document.createElement("a");
                    a.href = outputUrl;
                    a.download = "compressed." + (file.name.split(".").pop() || "mp4");
                    a.click();
                  }}>
                    <Download className="w-4 h-4" /> Download Compressed
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default VideoCompressor;
