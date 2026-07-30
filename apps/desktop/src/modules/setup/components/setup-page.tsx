import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CameraVideoIcon,
  Mic01Icon,
  Plug01Icon,
  SmartPhone01Icon,
  VolumeHighIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Banner,
  Button,
  Checklist,
  cn,
  GroupLabel,
  Meter,
  RecordDot,
  SourceChip,
  Switch,
  Tag,
} from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import type { ColorIconTone } from "@/components/color-icon";
import { CapturePreview } from "@/modules/canvas";
import { useCaptureSources } from "@/modules/capture";
import type { CaptureSource } from "@/modules/capture";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { useProject } from "@/modules/project";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import { SETUP_CHECKLIST } from "@/constants/recording";
import { projectsService } from "@/services";

const sourceIcons = {
  phone: SmartPhone01Icon,
  webcam: CameraVideoIcon,
  microphone: Mic01Icon,
} as const;

const sourceTones = {
  phone: "phone",
  webcam: "camera",
  microphone: "microphone",
} as const satisfies Record<keyof typeof sourceIcons, ColorIconTone>;

const sourceKindLabels = {
  phone: "phone",
  webcam: "webcam",
  microphone: "microphone",
} as const satisfies Record<CaptureSource["kind"], string>;

const selectableSourceKinds = ["phone", "webcam", "microphone"] as const;
const phoneAudioCaptureAvailable = false;

type SelectedSourceIds = Partial<Record<CaptureSource["kind"], string>>;

function selectedSourceForKind(
  sources: CaptureSource[],
  kind: CaptureSource["kind"],
  selectedId?: string
) {
  const available = sources.filter((source) => source.kind === kind && source.state === "available");
  return available.find((source) => source.id === selectedId) ?? available[0];
}

function sourceStateLabel(source: CaptureSource) {
  if (source.state === "permission-required") return "permission needed";
  if (source.state === "unavailable") return "unavailable";
  return sourceKindLabels[source.kind];
}

export function SetupPage() {
  const navigate = useNavigate();
  const { sources, loading, refresh } = useCaptureSources();
  const onboarding = useOnboardingRequirements();
  const activeProject = useProject((state) => state.activeProject);
  const doc = useProject((state) => state.doc);
  const loadProject = useProject((state) => state.loadProject);
  const setActiveProject = useProject((state) => state.setActiveProject);
  const [starting, setStarting] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<SelectedSourceIds>({});
  const [webcamRecordingEnabled, setWebcamRecordingEnabled] = useState(true);
  const [microphoneRecordingEnabled, setMicrophoneRecordingEnabled] = useState(true);
  const [phoneAudioEnabled, setPhoneAudioEnabled] = useState(false);
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

  useEffect(() => {
    setSelectedSourceIds((current) => {
      let changed = false;
      const next = { ...current };

      for (const kind of selectableSourceKinds) {
        const selectedId = current[kind];
        const available = sources.filter(
          (source) => source.kind === kind && source.state === "available"
        );

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

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  const selectSource = (source: CaptureSource) => {
    if (source.state !== "available") return;
    setSelectedSourceIds((current) => ({ ...current, [source.kind]: source.id }));
  };

  const startRecording = async () => {
    if (!onboarding.complete) {
      await navigate({ to: "/permissions" });
      return;
    }

    setStarting(true);
    try {
      const recordingSources = [
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
      ].filter((source): source is NonNullable<typeof source> => Boolean(source));
      const current = activeProject ? await projectsService.find(activeProject.id) : null;
      const draft =
        current ??
        (await projectsService.create({
          sources: recordingSources,
        }));
      const saved = await projectsService.saveDoc(draft, doc);
      const recording = await projectsService.setStatus(saved, "recording");
      loadProject(recording);
      setActiveProject(recording);
      await navigate({ to: "/record" });
    } catch {
      setStorageError("Local SQLite storage is required before recording can start.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="bg-window flex h-full min-w-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {!hasPhone ? (
          <Banner
            action={
              <Button
                disabled={loading}
                leading={
                  loading ? (
                    <ActivitySpinner size={14} />
                  ) : (
                    <ColorIcon icon={Plug01Icon} size={14} tone="plug" />
                  )
                }
                onClick={() => void refresh()}
                size="mini"
              >
                Look again
              </Button>
            }
            className="rounded-none border-x-0 border-t-0 px-5"
            tone="warn"
          >
            No iPhone found. Connect it with a cable, unlock it, and tap Trust This Computer.
          </Banner>
        ) : null}

        <div className="flex min-h-0 flex-1 items-stretch justify-stretch">
          <CapturePreview
            phoneDimensions={phoneSource}
            phoneUniqueId={hasPhone ? phoneSource?.uniqueId : undefined}
            webcamUniqueId={webcamEnabled ? webcamSource?.uniqueId : undefined}
          />
        </div>

        <footer className="border-titlebar-line bg-titlebar flex h-[84px] items-center gap-5 border-t px-7">
          <Button
            disabled={!hasPhone || starting || onboarding.loading || !onboarding.complete}
            leading={starting ? <ActivitySpinner size={16} /> : <RecordDot />}
            onClick={() => void startRecording()}
            size="md"
            variant="record"
          >
            Record
          </Button>
          <div className="text-fg-3 flex items-center gap-2 text-[12.5px]">
            {loading ? <ActivitySpinner size={16} /> : null}
            {hasPhone
              ? `${readySources.length} sources ready - saves to ${REELDOCK_RECORDINGS_DIR}`
              : "Waiting for a phone"}
          </div>
          {storageError ? <div className="text-warn-fg text-[12.5px]">{storageError}</div> : null}
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <span className="text-fg-hint text-[11px] font-semibold uppercase tracking-[0.1em]">
              Input
            </span>
            <Meter className="w-[150px]" />
          </div>
        </footer>
      </div>

      <aside className="border-titlebar-line bg-titlebar flex w-80 flex-col gap-6 overflow-y-auto border-l px-5 py-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Recording setup</h2>
          <p className="text-fg-3 mt-1 text-[12.5px] leading-[1.5]">
            Each source is saved as its own file. Arrange the layout later in the editor.
          </p>
        </div>

        <section>
          <GroupLabel className="mb-2.5">Sources</GroupLabel>
          <div className="flex flex-col gap-2">
            <SourceControl
              emptyLabel="No iPhone connected"
              enabled
              onSelect={selectSource}
              selectedSourceId={phoneSource?.id}
              sources={phoneSources}
            />
            <SourceControl
              emptyLabel="No camera found"
              enabled={webcamRecordingEnabled}
              onEnabledChange={setWebcamRecordingEnabled}
              onSelect={selectSource}
              selectedSourceId={webcamSource?.id}
              sources={webcamSources}
              switchLabel="Camera"
            />
            <SourceControl
              emptyLabel="No microphone found"
              enabled={microphoneRecordingEnabled}
              onEnabledChange={setMicrophoneRecordingEnabled}
              onSelect={selectSource}
              selectedSourceId={microphoneSource?.id}
              sources={microphoneSources}
              switchLabel="Microphone"
            />
            <SourceChip className="min-h-[68px] opacity-75" tone="warn">
              <ColorIcon icon={VolumeHighIcon} size={16} tone="phone" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold">Phone sound</div>
                <div className="text-fg-3 mt-px text-[11.5px]">native track needed</div>
              </div>
              <Switch
                checked={phoneAudioEnabled}
                disabled={!phoneAudioCaptureAvailable || !hasPhone}
                label="Phone sound"
                onChange={setPhoneAudioEnabled}
              />
            </SourceChip>
          </div>
        </section>

        <Checklist items={[...SETUP_CHECKLIST]} title="Before you start" />
      </aside>
    </main>
  );
}

type SourceControlProps = {
  sources: CaptureSource[];
  selectedSourceId?: string;
  enabled: boolean;
  switchLabel?: string;
  emptyLabel: string;
  onEnabledChange?: (enabled: boolean) => void;
  onSelect: (source: CaptureSource) => void;
};

function SourceControl({
  sources,
  selectedSourceId,
  enabled,
  switchLabel,
  emptyLabel,
  onEnabledChange,
  onSelect,
}: SourceControlProps) {
  if (!sources.length) {
    return (
      <SourceChip className="min-h-[68px] opacity-70" tone="warn">
        <ColorIcon icon={Plug01Icon} size={16} tone="plug" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold">{emptyLabel}</div>
          <div className="text-fg-3 mt-px text-[11.5px]">unavailable</div>
        </div>
      </SourceChip>
    );
  }

  return (
    <>
      {sources.map((source) => {
        const selected = source.id === selectedSourceId;
        const available = source.state === "available";
        return (
          <SourceChip
            className={cn(
              "min-h-[68px]",
              selected ? "border-accent-line" : "",
              !available ? "opacity-70" : ""
            )}
            key={source.id}
            tone={available ? "ok" : "warn"}
          >
            <ColorIcon icon={sourceIcons[source.kind]} size={16} tone={sourceTones[source.kind]} />
            <button
              className={cn(
                "min-w-0 flex-1 text-left",
                available ? "cursor-pointer" : "cursor-default"
              )}
              disabled={!available}
              onClick={() => onSelect(source)}
              type="button"
            >
              <div className="truncate text-[12.5px] font-semibold">{source.label}</div>
              <div className="mt-px flex items-center gap-2">
                <span className="text-fg-3 text-[11.5px]">{sourceStateLabel(source)}</span>
                {selected && sources.length > 1 ? <Tag>Selected</Tag> : null}
              </div>
            </button>
            {selected && switchLabel && onEnabledChange ? (
              <Switch checked={enabled} label={switchLabel} onChange={onEnabledChange} />
            ) : null}
          </SourceChip>
        );
      })}
    </>
  );
}
