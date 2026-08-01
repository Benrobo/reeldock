import { useEffect, useState } from "react";
import type { CaptureSource } from "@/modules/capture";
import { preferencesService } from "@/services";

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
  const defaultSource =
    kind === "microphone"
      ? (available.find((source) => source.isDefault) ?? available[0])
      : available[0];
  return available.find((source) => source.id === selectedId) ?? defaultSource;
}

export function useSetupSources(sources: CaptureSource[]) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<SelectedSourceIds>({});
  const [webcamRecordingEnabled, setWebcamRecordingEnabled] = useState(true);
  const [microphoneRecordingEnabled, setMicrophoneRecordingEnabled] = useState(true);
  const [phoneAudioMonitoringEnabled, setPhoneAudioMonitoringEnabled] = useState(false);
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
    let cancelled = false;

    preferencesService
      .get()
      .then((preferences) => {
        if (!cancelled) setSelectedSourceIds(preferences.selectedSources);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedSourceIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const kind of selectableSourceKinds) {
        const selectedId = current[kind];
        const available = availableSourcesOfKind(sources, kind);

        if (!available.length) {
          continue;
        }

        if (!selectedId) {
          next[kind] = selectedSourceForKind(sources, kind)?.id;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [sources]);

  const selectSource = (source: CaptureSource) => {
    if (source.state !== "available") return;
    const next = { ...selectedSourceIds, [source.kind]: source.id };
    setSelectedSourceIds(next);
    void preferencesService.save({ selectedSources: next }).catch(() => {});
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
    phoneAudioMonitoringEnabled,
    setWebcamRecordingEnabled,
    setMicrophoneRecordingEnabled,
    setPhoneAudioMonitoringEnabled,
    selectSource,
  };
}

export type SetupSourcesState = ReturnType<typeof useSetupSources>;
