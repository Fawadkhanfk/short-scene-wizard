import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PollingOptions {
  /** Conversion ID in the database */
  conversionId: string | null;
  /** Called with progress updates (0-100) */
  onProgress: (progress: number) => void;
  /** Called when conversion completes with the output path */
  onComplete: (outputPath: string) => void;
  /** Called when conversion fails */
  onError: (message: string) => void;
  /** Polling interval in ms (default 3000) */
  interval?: number;
  /** Whether polling is active */
  enabled?: boolean;
}

/**
 * Polls the conversions table for real-time progress updates.
 * Automatically stops when status is "ready" or "failed".
 */
export function useConversionPolling({
  conversionId,
  onProgress,
  onComplete,
  onError,
  interval = 3000,
  enabled = true,
}: PollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!conversionId || !enabled) return;
    stoppedRef.current = false;

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const { data, error } = await supabase
          .from("conversions")
          .select("status, progress, output_path, error_message")
          .eq("id", conversionId)
          .single();

        if (error || !data) return;

        onProgress(data.progress ?? 0);

        if (data.status === "ready" && data.output_path) {
          stop();
          onComplete(data.output_path);
        } else if (data.status === "failed") {
          stop();
          onError(data.error_message || "Conversion failed");
        }
      } catch {
        // Silently ignore transient fetch errors
      }
    };

    // Initial poll immediately
    poll();
    intervalRef.current = setInterval(poll, interval);

    return stop;
  }, [conversionId, enabled, interval, onProgress, onComplete, onError, stop]);

  return { stop };
}
