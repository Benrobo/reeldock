import { useEffect, useState } from "react";
import { listCaptureSources } from "@/modules/capture/lib/bridge";
import type { CaptureSource } from "@/modules/capture/types";

type CaptureSourcesState = {
  sources: CaptureSource[];
  loading: boolean;
};

export function useCaptureSources(): CaptureSourcesState {
  const [state, setState] = useState<CaptureSourcesState>({
    sources: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    listCaptureSources()
      .then((sources) => {
        if (!cancelled) setState({ sources, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ sources: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
