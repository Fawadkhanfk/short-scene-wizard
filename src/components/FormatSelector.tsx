import React, { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { VIDEO_FORMATS } from "@/lib/constants";

interface FormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
  label?: string;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange, label = "Convert to" }) => {
  const [search, setSearch] = useState("");

  const filtered = VIDEO_FORMATS.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 min-w-[180px]">
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 text-base font-semibold border-2 border-primary/30 focus:border-primary">
          <SelectValue placeholder="Select format..." />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search formats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(fmt => (
              <SelectItem key={fmt} value={fmt.toLowerCase()}>
                <span className="font-mono font-semibold text-primary mr-2">{fmt}</span>
                <span className="text-muted-foreground text-xs">.{fmt.toLowerCase()}</span>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FormatSelector;
