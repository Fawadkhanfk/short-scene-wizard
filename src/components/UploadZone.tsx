import React, { useState, useRef } from "react";
import { Upload, Link, Cloud, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 500;

const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4", "video/x-matroska", "video/quicktime", "video/x-msvideo",
  "video/webm", "video/x-flv", "video/x-ms-wmv", "video/3gpp", "video/3gpp2",
  "video/mpeg", "video/mp2t", "video/ogg", "video/x-m4v",
]);

const SUPPORTED_EXTENSIONS = new Set([
  "mp4", "mkv", "mov", "avi", "webm", "flv", "wmv", "3gp", "3g2", "3gpp",
  "mpeg", "mpg", "m4v", "m2ts", "mts", "ts", "vob", "ogv", "gif", "swf",
  "mod", "qt", "rm", "rmvb", "divx", "xvid", "asf", "mpv", "wtv", "mxf",
  "m1v", "f4p", "f4v", "ogg",
]);

function getFileExtension(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function validateFile(file: File, maxSizeMB: number): string | null {
  const ext = getFileExtension(file.name);
  const isTypeValid = SUPPORTED_VIDEO_TYPES.has(file.type) || SUPPORTED_EXTENSIONS.has(ext);

  if (!isTypeValid) {
    return `"${file.name}" is not a supported video format. Supported: MP4, MKV, MOV, AVI, WebM, and 30+ more.`;
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `"${file.name}" (${formatBytes(file.size)}) exceeds the ${maxSizeMB}MB limit.`;
  }

  if (file.size === 0) {
    return `"${file.name}" is empty (0 bytes).`;
  }

  return null;
}

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUrlSubmit?: (url: string) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onUrlSubmit,
  accept = "video/*",
  multiple = true,
  maxSizeMB = MAX_FILE_SIZE_MB,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (rawFiles: File[]) => {
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of rawFiles) {
      const error = validateFile(file, maxSizeMB);
      if (error) {
        errors.push(error);
      } else {
        valid.push(file);
      }
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
    }

    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) processFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && onUrlSubmit) {
      onUrlSubmit(url.trim());
      setUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "upload-zone rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
          dragOver && "drag-over scale-[1.01]"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">Drop your video files here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse · Max {maxSizeMB}MB per file
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, MKV, MOV, AVI, WebM, GIF and 30+ formats supported
            </p>
          </div>
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        {/* Choose Files dropdown */}
        <div className="relative">
          <Button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="gradient-primary border-0 text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose Files
            <ChevronDown className="w-4 h-4" />
          </Button>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[180px] overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-foreground"
                onClick={() => { fileInputRef.current?.click(); setShowDropdown(false); }}
              >
                <Upload className="w-4 h-4 text-primary" /> From Device
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-foreground"
                onClick={() => { setShowUrlInput(true); setShowDropdown(false); }}
              >
                <Link className="w-4 h-4 text-primary" /> From URL
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent text-muted-foreground"
                onClick={() => setShowDropdown(false)}
              >
                <Cloud className="w-4 h-4" /> Google Drive <span className="text-xs opacity-60 ml-auto">Soon</span>
              </button>
            </div>
          )}
        </div>

        {onUrlSubmit && (
          <Button variant="outline" onClick={() => setShowUrlInput(!showUrlInput)} className="gap-2">
            <Link className="w-4 h-4" /> From URL
          </Button>
        )}
      </div>

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="mt-4 flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="flex-1"
          />
          <Button type="submit" className="gradient-primary border-0 text-white">
            Add
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowUrlInput(false)}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
};

export default UploadZone;
