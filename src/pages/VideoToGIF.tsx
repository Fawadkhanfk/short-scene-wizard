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

  return (
    <>
      <Helmet>
        <title>Video to GIF Converter — Free Online Tool | VideoConvert Pro</title>
        <meta name="description" content="Convert any video to animated GIF online. Control FPS, colors, quality, and trim. Free and fast." />
      </Helmet>

      <section className="gradient-hero py-14">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Video to <span className="text-gradient">GIF</span>
          </h1>
          <p className="text-muted-foreground">Convert any video to a high-quality animated GIF</p>
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
              <h3 className="font-semibold">GIF Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Frame Rate</Label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["5", "10", "15", "24"].map(f => (
                        <SelectItem key={f} value={f}>{f} fps</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Color Palette</Label>
                  <Select value={colors} onValueChange={setColors}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["64", "128", "256"].map(c => (
                        <SelectItem key={c} value={c}>{c} colors</SelectItem>
                      ))}
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
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Width (px, leave blank for original)</Label>
                <Input placeholder="e.g. 480" value={width} onChange={e => setWidth(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim Start (s)</Label>
                  <Input placeholder="0" value={trimStart} onChange={e => setTrimStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim End (s)</Label>
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
                  <Button className="gradient-primary border-0 text-white gap-2" onClick={() => {
                    const a = document.createElement("a");
                    a.href = outputUrl;
                    a.download = "output.gif";
                    a.click();
                  }}>
                    <Download className="w-4 h-4" /> Download GIF
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

export default VideoToGIF;
