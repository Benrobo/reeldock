import { useState } from "react";
import type { CanvasRatio } from "@reeldock/shared";

export type ExportState = "idle" | "running" | "done" | "failed";

export function useEditorExport() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExportState>("idle");
  const [ratio, setRatio] = useState<Exclude<CanvasRatio, "custom">>("16:9");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const nativeExportAvailable = false;

  const openModal = () => {
    setOpen(true);
    setState("idle");
    setError(null);
  };

  const start = async () => {
    setProgress(0);
    setError(
      "Native export is the next phase. The editor can save composition, trim, and audio metadata, but it cannot render MP4 yet."
    );
    setState("failed");
  };

  return {
    error,
    nativeExportAvailable,
    open,
    openModal,
    progress,
    ratio,
    setOpen,
    setRatio,
    start,
    state,
  };
}
