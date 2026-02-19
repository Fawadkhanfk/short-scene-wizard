import React from "react";
import { Zap } from "lucide-react";
import { ConversionSettings, defaultSettings } from "@/components/AdvancedSettings";
import { cn } from "@/lib/utils";

export interface Preset {
  label: string;
  sublabel: string;
  emoji: string;
  format: string;
  settings: Partial<ConversionSettings>;
  color: string;
}

export const QUICK_PRESETS: Preset[] = [
  {
    label: "MP4 HD",
    sublabel: "1080p · 30fps · H.264",
    emoji: "🎬",
    format: "mp4",
    color: "preset-blue",
    settings: {
      videoCodec: "libx264",
      resolution: "1920x1080",
      frameRate: "30",
      audioCodec: "aac",
    },
  },
  {
    label: "TikTok / Reels",
    sublabel: "9:16 · 1080p · MP4",
    emoji: "📱",
    format: "mp4",
    color: "preset-pink",
    settings: {
      videoCodec: "libx264",
      resolution: "1080x1920",
      frameRate: "30",
      audioCodec: "aac",
    },
  },
  {
    label: "YouTube",
    sublabel: "16:9 · 1080p · 60fps",
    emoji: "▶️",
    format: "mp4",
    color: "preset-red",
    settings: {
      videoCodec: "libx264",
      resolution: "1920x1080",
      frameRate: "60",
      audioCodec: "aac",
    },
  },
  {
    label: "Twitter / X",
    sublabel: "720p · H.264 · MP4",
    emoji: "🐦",
    format: "mp4",
    color: "preset-sky",
    settings: {
      videoCodec: "libx264",
      resolution: "1280x720",
      frameRate: "30",
      audioCodec: "aac",
    },
  },
  {
    label: "GIF",
    sublabel: "Animated · 15fps",
    emoji: "🎭",
    format: "gif",
    color: "preset-purple",
    settings: {
      videoCodec: "auto",
      resolution: "640x360",
      frameRate: "15",
      removeAudio: true,
    },
  },
  {
    label: "Web / WebM",
    sublabel: "720p · VP9 · No audio",
    emoji: "🌐",
    format: "webm",
    color: "preset-green",
    settings: {
      videoCodec: "libvpx-vp9",
      resolution: "1280x720",
      frameRate: "30",
      audioCodec: "auto",
    },
  },
  {
    label: "iPhone",
    sublabel: "MP4 · H.264 · AAC",
    emoji: "📲",
    format: "mp4",
    color: "preset-slate",
    settings: {
      videoCodec: "libx264",
      resolution: "1920x1080",
      frameRate: "30",
      audioCodec: "aac",
    },
  },
  {
    label: "Small File",
    sublabel: "480p · Low bitrate",
    emoji: "📦",
    format: "mp4",
    color: "preset-amber",
    settings: {
      videoCodec: "libx264",
      resolution: "854x480",
      frameRate: "24",
      audioCodec: "aac",
      videoBitrate: "800",
      audioBitrate: "128",
    },
  },
];

interface QuickPresetsProps {
  activePreset: string | null;
  onApply: (preset: Preset) => void;
}

const colorMap: Record<string, string> = {
  "preset-blue":   "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:border-blue-400 data-[active=true]:ring-2 data-[active=true]:ring-blue-300",
  "preset-pink":   "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 data-[active=true]:bg-pink-100 data-[active=true]:border-pink-400 data-[active=true]:ring-2 data-[active=true]:ring-pink-300",
  "preset-red":    "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 data-[active=true]:bg-red-100 data-[active=true]:border-red-400 data-[active=true]:ring-2 data-[active=true]:ring-red-300",
  "preset-sky":    "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 data-[active=true]:bg-sky-100 data-[active=true]:border-sky-400 data-[active=true]:ring-2 data-[active=true]:ring-sky-300",
  "preset-purple": "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 data-[active=true]:bg-purple-100 data-[active=true]:border-purple-400 data-[active=true]:ring-2 data-[active=true]:ring-purple-300",
  "preset-green":  "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 data-[active=true]:bg-emerald-100 data-[active=true]:border-emerald-400 data-[active=true]:ring-2 data-[active=true]:ring-emerald-300",
  "preset-slate":  "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 data-[active=true]:bg-slate-100 data-[active=true]:border-slate-500 data-[active=true]:ring-2 data-[active=true]:ring-slate-300",
  "preset-amber":  "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 data-[active=true]:bg-amber-100 data-[active=true]:border-amber-400 data-[active=true]:ring-2 data-[active=true]:ring-amber-300",
};

const QuickPresets: React.FC<QuickPresetsProps> = ({ activePreset, onApply }) => {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Presets
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => {
          const isActive = activePreset === preset.label;
          return (
            <button
              key={preset.label}
              data-active={isActive}
              onClick={() => onApply(preset)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none",
                colorMap[preset.color]
              )}
            >
              <span className="text-base leading-none">{preset.emoji}</span>
              <span className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-[13px]">{preset.label}</span>
                <span className="text-[10px] opacity-70 font-normal">{preset.sublabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickPresets;
