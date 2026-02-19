import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, X, FileVideo, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

export interface ConversionJob {
  id: string;
  file?: File;
  filename: string;
  outputFormat: string;
  status: "pending" | "uploading" | "converting" | "ready" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
  fileSize?: number;
}

interface ConversionQueueProps {
  jobs: ConversionJob[];
  onRemove: (id: string) => void;
  onDownload: (job: ConversionJob) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "ready": return <CheckCircle className="w-5 h-5 text-success" />;
    case "failed": return <AlertCircle className="w-5 h-5 text-destructive" />;
    case "converting":
    case "uploading": return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    default: return <FileVideo className="w-5 h-5 text-muted-foreground" />;
  }
};

const ConversionQueue: React.FC<ConversionQueueProps> = ({ jobs, onRemove, onDownload }) => {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <div key={job.id} className="bg-card border border-border rounded-xl p-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <StatusIcon status={job.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{job.filename}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"
                  )}>
                    {STATUS_LABELS[job.status] || job.status}
                  </span>
                  {job.status !== "ready" && (
                    <button onClick={() => onRemove(job.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {job.fileSize && <span>{formatBytes(job.fileSize)}</span>}
                {job.fileSize && <span>·</span>}
                <span className="font-mono uppercase">{job.outputFormat}</span>
              </div>

              {(job.status === "uploading" || job.status === "converting") && (
                <div className="mt-2">
                  <Progress value={job.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">{job.progress}%</p>
                </div>
              )}

              {job.status === "failed" && job.error && (
                <p className="text-xs text-destructive mt-1">{job.error}</p>
              )}

              {job.status === "ready" && (
                <Button
                  size="sm"
                  className="mt-2 h-8 gradient-primary border-0 text-white gap-1.5"
                  onClick={() => onDownload(job)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {job.outputFormat.toUpperCase()}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversionQueue;
