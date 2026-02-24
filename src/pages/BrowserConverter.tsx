import React, { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Loader2, CheckCircle, AlertCircle, Film } from "lucide-react";
import { toast } from "sonner";

const OUTPUT_FORMATS = [
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WebM" },
  { value: "avi", label: "AVI" },
  { value: "mov", label: "MOV" },
  { value: "mkv", label: "MKV" },
  { value: "gif", label: "GIF" },
];

const BrowserConverter = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const loadFFmpeg = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("log", ({ message }) => {
        setLogMessages((prev) => [...prev.slice(-50), message]);
      });

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setLoaded(true);
      toast.success("FFmpeg loaded — ready to convert!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load FFmpeg";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOutputUrl(null);
      setError(null);
      setProgress(0);
      setLogMessages([]);
    }
  };

  const handleConvert = async () => {
    if (!file || !ffmpegRef.current) return;
    setConverting(true);
    setProgress(0);
    setError(null);
    setOutputUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = "input." + (file.name.split(".").pop() || "mp4");
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec(["-i", inputName, outputName]);

      const data = await ffmpeg.readFile(outputName);
      // @ts-ignore - FFmpeg FileData type mismatch with BlobPart
      const blob = new Blob([data], { type: `video/${outputFormat}` });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setProgress(100);
      toast.success("Conversion complete!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl || !file) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + "." + outputFormat;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <Helmet>
        <title>Browser Video Converter — Convert Videos Offline | VideoConvert Pro</title>
        <meta name="description" content="Convert videos directly in your browser using FFmpeg.wasm. No upload needed — 100% private, offline-capable video conversion." />
      </Helmet>

      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Film className="w-3.5 h-3.5" /> 100% In-Browser · No Upload · Private
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Browser <span className="text-gradient">Video Converter</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Convert videos entirely in your browser using FFmpeg.wasm. Your files never leave your device.
            </p>
          </div>

          <Card className="p-6 md:p-8 space-y-6">
            {/* Step 1: Load FFmpeg */}
            {!loaded && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  FFmpeg.wasm needs to be loaded first (~31 MB one-time download).
                </p>
                <Button
                  size="lg"
                  onClick={loadFFmpeg}
                  disabled={loading}
                  className="gradient-primary border-0 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading FFmpeg…
                    </>
                  ) : (
                    "Load FFmpeg Engine"
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Upload file */}
            {loaded && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select a video file</label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : "Click to choose a video file"}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {/* Format selector */}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium mb-2">Output format</label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTPUT_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={!file || converting}
                    className="gradient-primary border-0 text-white h-10 px-8 shrink-0"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Converting…
                      </>
                    ) : (
                      "Convert"
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {converting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-muted-foreground text-center">{progress}%</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Download */}
                {outputUrl && (
                  <div className="flex flex-col items-center gap-3 p-4 bg-accent rounded-xl">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" /> Conversion complete!
                    </div>
                    <Button onClick={handleDownload} className="gradient-primary border-0 text-white">
                      <Download className="w-4 h-4" /> Download {outputFormat.toUpperCase()}
                    </Button>
                  </div>
                )}

                {/* Log */}
                {logMessages.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">FFmpeg logs</summary>
                    <pre className="mt-2 max-h-40 overflow-auto bg-muted rounded-lg p-3 text-muted-foreground whitespace-pre-wrap">
                      {logMessages.join("\n")}
                    </pre>
                  </details>
                )}
              </>
            )}
          </Card>
        </div>
      </section>
    </>
  );
};

export default BrowserConverter;
