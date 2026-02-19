import React, { useState, useRef } from "react";
import { Upload, Link, Cloud, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  maxSizeMB = 500,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("video/") || f.size > 0);
    if (files.length) onFilesSelected(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFilesSelected(files);
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
          </div>
        </div>
      </div>

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
