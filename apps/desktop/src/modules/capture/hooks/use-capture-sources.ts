import { useCallback, useEffect, useState } from "react";
import { listCaptureSources } from "@/modules/capture/lib/bridge";
import type { CaptureSource } from "@/modules/capture/types";

type CaptureSourcesState = {
  sources: CaptureSource[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const POLL_INTERVAL_MS = 1500;

export function useCaptureSources(): CaptureSourcesState {
  const [sources, setSources] = useState<CaptureSource[]>([]);
  const [loading, setLoading] = useState(true);

  const read = useCallback(async () => {
    try {
      setSources(await listCaptureSources());
    } catch {
      setSources([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await read();
    setLoading(false);
  }, [read]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void read(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, read]);

  return { sources, loading, refresh };
}
