import React from "react";
import { Zap, X } from "lucide-react";
import { ConversionSettings } from "@/components/AdvancedSettings";
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
    color: "blue",
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
    color: "pink",
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
    color: "red",
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
    color: "sky",
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
    color: "purple",
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
    color: "emerald",
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
    color: "slate",
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
    color: "amber",
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

// Base (inactive) styles per color
const baseStyles: Record<string, string> = {
  blue:    "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300",
  pink:    "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:border-pink-300",
  red:     "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300",
  sky:     "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300",
  purple:  "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
  slate:   "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300",
  amber:   "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300",
};

// Active (selected) styles per color — stronger fill + ring
const activeStyles: Record<string, string> = {
  blue:    "border-blue-500 bg-blue-500 text-white shadow-md ring-2 ring-blue-300 ring-offset-1",
  pink:    "border-pink-500 bg-pink-500 text-white shadow-md ring-2 ring-pink-300 ring-offset-1",
  red:     "border-red-500 bg-red-500 text-white shadow-md ring-2 ring-red-300 ring-offset-1",
  sky:     "border-sky-500 bg-sky-500 text-white shadow-md ring-2 ring-sky-300 ring-offset-1",
  purple:  "border-purple-500 bg-purple-500 text-white shadow-md ring-2 ring-purple-300 ring-offset-1",
  emerald: "border-emerald-500 bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 ring-offset-1",
  slate:   "border-slate-600 bg-slate-600 text-white shadow-md ring-2 ring-slate-300 ring-offset-1",
  amber:   "border-amber-500 bg-amber-500 text-white shadow-md ring-2 ring-amber-300 ring-offset-1",
};

interface QuickPresetsProps {
  activePreset: string | null;
  onApply: (preset: Preset) => void;
  onClear?: () => void;
}

const QuickPresets: React.FC<QuickPresetsProps> = ({ activePreset, onApply, onClear }) => {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Presets
          </span>
        </div>
        {activePreset && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear preset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => {
          const isActive = activePreset === preset.label;
          return (
            <button
              key={preset.label}
              onClick={() => onApply(preset)}
              title={isActive ? `Click to deselect "${preset.label}"` : `Apply ${preset.label} preset`}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer select-none",
                isActive ? activeStyles[preset.color] : baseStyles[preset.color]
              )}
            >
              <span className="text-base leading-none">{preset.emoji}</span>
              <span className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-[13px]">{preset.label}</span>
                <span className={cn("text-[10px] font-normal", isActive ? "opacity-80" : "opacity-60")}>
                  {preset.sublabel}
                </span>
              </span>
              {isActive && <X className="w-3 h-3 ml-0.5 opacity-70" />}
            </button>
          );
        })}
      </div>

      {activePreset && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          ✓ <span className="font-medium text-foreground">{activePreset}</span> preset active — changing format or settings will clear it
        </p>
      )}
    </div>
  );
};

export default QuickPresets;
