import React from "react";
import { ASPECT_RATIOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AspectRatioSelectorProps {
  value: string;
  onChange: (value: string) => void;
  customWidth?: string;
  customHeight?: string;
  onCustomWidthChange?: (w: string) => void;
  onCustomHeightChange?: (h: string) => void;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  value, onChange, customWidth, customHeight, onCustomWidthChange, onCustomHeightChange
}) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground mb-3">Output Aspect Ratio</p>
    <div className="flex flex-wrap gap-2">
      {ASPECT_RATIOS.map(ar => (
        <button
          key={ar.value}
          onClick={() => onChange(ar.value)}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 text-sm transition-all",
            value === ar.value
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-lg">{ar.icon}</span>
          <span className="font-bold text-xs">{ar.label}</span>
          <span className="text-xs opacity-70">{ar.sublabel}</span>
        </button>
      ))}
    </div>
    {value === "custom" && (
      <div className="flex gap-2 mt-3">
        <input
          className="border border-border rounded-lg px-3 py-2 text-sm w-24 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Width"
          value={customWidth}
          onChange={e => onCustomWidthChange?.(e.target.value)}
        />
        <span className="flex items-center text-muted-foreground">×</span>
        <input
          className="border border-border rounded-lg px-3 py-2 text-sm w-24 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Height"
          value={customHeight}
          onChange={e => onCustomHeightChange?.(e.target.value)}
        />
        <span className="flex items-center text-xs text-muted-foreground">px</span>
      </div>
    )}
  </div>
);

export default AspectRatioSelector;
