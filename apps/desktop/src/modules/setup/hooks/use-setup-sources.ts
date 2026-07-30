import { useEffect, useState } from "react";
import type { CaptureSource } from "@/modules/capture";

const selectableSourceKinds = ["phone", "webcam", "microphone"] as const;

type SelectedSourceIds = Partial<Record<CaptureSource["kind"], string>>;

export type RecordingSourceSelection = {
  kind: CaptureSource["kind"];
  label: string;
  enabled: boolean;
};

function availableSourcesOfKind(sources: CaptureSource[], kind: CaptureSource["kind"]) {
  return sources.filter((source) => source.kind === kind && source.state === "available");
}

function selectedSourceForKind(
  sources: CaptureSource[],
  kind: CaptureSource["kind"],
  selectedId?: string
) {
  const available = availableSourcesOfKind(sources, kind);
  return available.find((source) => source.id === selectedId) ?? available[0];
}

export function useSetupSources(sources: CaptureSource[]) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<SelectedSourceIds>({});
  const [webcamRecordingEnabled, setWebcamRecordingEnabled] = useState(true);
  const [microphoneRecordingEnabled, setMicrophoneRecordingEnabled] = useState(true);
  const phoneSources = sources.filter((source) => source.kind === "phone");
  const webcamSources = sources.filter((source) => source.kind === "webcam");
  const microphoneSources = sources.filter((source) => source.kind === "microphone");
  const phoneSource = selectedSourceForKind(sources, "phone", selectedSourceIds.phone);
  const webcamSource = selectedSourceForKind(sources, "webcam", selectedSourceIds.webcam);
  const microphoneSource = selectedSourceForKind(
    sources,
    "microphone",
    selectedSourceIds.microphone
  );
  const hasPhone = Boolean(phoneSource);
  const webcamEnabled = Boolean(webcamSource && webcamRecordingEnabled);
  const microphoneEnabled = Boolean(microphoneSource && microphoneRecordingEnabled);
  const readySources = [
    phoneSource,
    webcamEnabled ? webcamSource : undefined,
    microphoneEnabled ? microphoneSource : undefined,
  ].filter(Boolean);
  const recordingSources: RecordingSourceSelection[] = [
    phoneSource ? { kind: phoneSource.kind, label: phoneSource.label, enabled: true } : null,
    webcamSource
      ? { kind: webcamSource.kind, label: webcamSource.label, enabled: webcamEnabled }
      : null,
    microphoneSource
      ? {
          kind: microphoneSource.kind,
          label: microphoneSource.label,
          enabled: microphoneEnabled,
        }
      : null,
  ].filter((source): source is RecordingSourceSelection => Boolean(source));

  useEffect(() => {
    setSelectedSourceIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const kind of selectableSourceKinds) {
        const selectedId = current[kind];
        const available = availableSourcesOfKind(sources, kind);

        if (!available.length) {
          if (selectedId) {
            delete next[kind];
            changed = true;
          }
          continue;
        }

        if (!selectedId || !available.some((source) => source.id === selectedId)) {
          next[kind] = available[0].id;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [sources]);

  const selectSource = (source: CaptureSource) => {
    if (source.state !== "available") return;
    setSelectedSourceIds((current) => ({ ...current, [source.kind]: source.id }));
  };

  return {
    phoneSources,
    webcamSources,
    microphoneSources,
    phoneSource,
    webcamSource,
    microphoneSource,
    hasPhone,
    webcamEnabled,
    microphoneEnabled,
    readySources,
    recordingSources,
    webcamRecordingEnabled,
    microphoneRecordingEnabled,
    setWebcamRecordingEnabled,
    setMicrophoneRecordingEnabled,
    selectSource,
  };
}
