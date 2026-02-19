import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings2 } from "lucide-react";
import {
  VIDEO_CODECS, AUDIO_CODECS, RESOLUTIONS, FRAME_RATES, ROTATE_OPTIONS, FLIP_OPTIONS
} from "@/lib/constants";

export interface ConversionSettings {
  videoCodec: string;
  resolution: string;
  customWidth: string;
  customHeight: string;
  frameRate: string;
  rotate: string;
  flip: string;
  audioCodec: string;
  volume: number;
  fadeInAudio: boolean;
  fadeOutAudio: boolean;
  removeAudio: boolean;
  trimStart: string;
  trimEnd: string;
  cropWidth: string;
  cropHeight: string;
  cropX: string;
  cropY: string;
  videoBitrate: string;
  audioBitrate: string;
}

export const defaultSettings: ConversionSettings = {
  videoCodec: "auto",
  resolution: "no_change",
  customWidth: "",
  customHeight: "",
  frameRate: "no_change",
  rotate: "none",
  flip: "none",
  audioCodec: "auto",
  volume: 100,
  fadeInAudio: false,
  fadeOutAudio: false,
  removeAudio: false,
  trimStart: "",
  trimEnd: "",
  cropWidth: "",
  cropHeight: "",
  cropX: "",
  cropY: "",
  videoBitrate: "",
  audioBitrate: "",
};

interface AdvancedSettingsProps {
  settings: ConversionSettings;
  onChange: (settings: ConversionSettings) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onChange }) => {
  const update = (key: keyof ConversionSettings, value: string | number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-0">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-accent">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings2 className="w-4 h-4 text-primary" />
              Advanced Settings
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video Codec */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Video Codec</Label>
                <Select value={settings.videoCodec} onValueChange={v => update("videoCodec", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_CODECS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Resize Video</Label>
                <Select value={settings.resolution} onValueChange={v => update("resolution", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {settings.resolution === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Width" value={settings.customWidth} onChange={e => update("customWidth", e.target.value)} />
                    <span className="flex items-center text-muted-foreground">×</span>
                    <Input placeholder="Height" value={settings.customHeight} onChange={e => update("customHeight", e.target.value)} />
                  </div>
                )}
              </div>

              {/* Frame Rate */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Frame Rate</Label>
                <Select value={settings.frameRate} onValueChange={v => update("frameRate", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRAME_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Rotate */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Rotate Video</Label>
                <Select value={settings.rotate} onValueChange={v => update("rotate", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROTATE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Flip */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Flip Video</Label>
                <Select value={settings.flip} onValueChange={v => update("flip", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FLIP_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Codec */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Audio Codec</Label>
                <Select value={settings.audioCodec} onValueChange={v => update("audioCodec", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIO_CODECS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Volume */}
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Adjust Volume — {settings.volume}%
                </Label>
                <Slider
                  min={0} max={400} step={5}
                  value={[settings.volume]}
                  onValueChange={([v]) => update("volume", v)}
                />
              </div>

              {/* Audio toggles */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label className="text-sm">Fade In Audio</Label>
                <Switch checked={settings.fadeInAudio} onCheckedChange={v => update("fadeInAudio", v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label className="text-sm">Fade Out Audio</Label>
                <Switch checked={settings.fadeOutAudio} onCheckedChange={v => update("fadeOutAudio", v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
                <Label className="text-sm font-medium text-destructive">Remove Audio</Label>
                <Switch checked={settings.removeAudio} onCheckedChange={v => update("removeAudio", v)} />
              </div>

              {/* Trim */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim Start (HH:MM:SS)</Label>
                <Input placeholder="00:00:00" value={settings.trimStart} onChange={e => update("trimStart", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Trim End (HH:MM:SS)</Label>
                <Input placeholder="00:00:00" value={settings.trimEnd} onChange={e => update("trimEnd", e.target.value)} />
              </div>

              {/* Crop */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Crop Width × Height</Label>
                <div className="flex gap-2">
                  <Input placeholder="W" value={settings.cropWidth} onChange={e => update("cropWidth", e.target.value)} />
                  <span className="flex items-center text-muted-foreground">×</span>
                  <Input placeholder="H" value={settings.cropHeight} onChange={e => update("cropHeight", e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Crop Position (X, Y)</Label>
                <div className="flex gap-2">
                  <Input placeholder="X" value={settings.cropX} onChange={e => update("cropX", e.target.value)} />
                  <Input placeholder="Y" value={settings.cropY} onChange={e => update("cropY", e.target.value)} />
                </div>
              </div>

              {/* Bitrate */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Video Bitrate (kbps)</Label>
                <Input placeholder="Auto" value={settings.videoBitrate} onChange={e => update("videoBitrate", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Audio Bitrate (kbps)</Label>
                <Input placeholder="Auto" value={settings.audioBitrate} onChange={e => update("audioBitrate", e.target.value)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AdvancedSettings;
