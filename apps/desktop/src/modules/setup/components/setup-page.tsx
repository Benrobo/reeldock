import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft01Icon,
  Plug01Icon,
  StopIcon,
  Timer01Icon,
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
  RecordingPill,
  SurfaceRow,
  Timecode,
} from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import { timecode } from "@/lib/format";
import { CapturePreview } from "@/modules/canvas";
import { useCaptureSources, useMicrophoneMeter } from "@/modules/capture";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { useProject } from "@/modules/project";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import { SETUP_CHECKLIST } from "@/constants/recording";
import { SetupSourceControls } from "./setup-source-controls";
import type { SetupSourcesState } from "../hooks/use-setup-sources";
import { useSetupRecording } from "../hooks/use-setup-recording";
import { useSetupSources } from "../hooks/use-setup-sources";

export function SetupPage() {
  const navigate = useNavigate();
  const { sources, loading, refresh } = useCaptureSources();
  const onboarding = useOnboardingRequirements();
  const activeProject = useProject((state) => state.activeProject);
  const doc = useProject((state) => state.doc);
  const loadProject = useProject((state) => state.loadProject);
  const setActiveProject = useProject((state) => state.setActiveProject);
  const setupSources = useSetupSources(sources);
  const recording = useSetupRecording({
    activeProject,
    doc,
    onboardingComplete: onboarding.complete,
    onboardingLoading: onboarding.loading,
    setupSources,
    loadProject,
    setActiveProject,
    onNeedsPermissions: () => navigate({ to: "/permissions" }),
    onRecorded: () => navigate({ to: "/edit" }),
  });
  const microphoneMeter = useMicrophoneMeter(
    setupSources.microphoneSource?.uniqueId,
    setupSources.microphoneEnabled && !recording.locked
  );

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  useEffect(() => {
    if (!recording.storageAvailable) return;
    const value =
      recording.state.status === "counting-down" ? String(recording.state.value) : null;
    void invoke("set_preview_countdown", { value });
  }, [recording.state, recording.storageAvailable]);

  useEffect(() => {
    return () => {
      if (recording.storageAvailable) void invoke("set_preview_countdown", { value: null });
    };
  }, [recording.storageAvailable]);

  return (
    <main className="bg-window relative flex h-full min-w-0 flex-col">
      <header className="border-titlebar-line bg-titlebar flex h-[52px] shrink-0 items-center gap-3.5 border-b px-[18px]">
        <Link to="/">
          <Button leading={<ColorIcon icon={ArrowLeft01Icon} size={15} tone="back" />} size="mini">
            Projects
          </Button>
        </Link>
        <div className="text-[13px] font-semibold">Recording setup</div>
        <div className="text-fg-hint text-xs">{setupSources.readySources.length} sources ready</div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {!setupSources.hasPhone ? (
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

          <div className="relative flex min-h-0 flex-1 items-stretch justify-stretch">
            <CapturePreview
              phoneDimensions={setupSources.phoneSource}
              phoneUniqueId={setupSources.hasPhone ? setupSources.phoneSource?.uniqueId : undefined}
              recordingActive={recording.locked}
              webcamUniqueId={
                setupSources.webcamEnabled ? setupSources.webcamSource?.uniqueId : undefined
              }
            />
            <RecordingPreviewOverlay
              elapsedSeconds={recording.elapsedSeconds}
              state={recording.state}
            />
          </div>

          <footer className="border-titlebar-line bg-titlebar flex h-[84px] shrink-0 items-center gap-5 border-t px-7">
            {recording.state.status === "recording" ? (
              <Button
                leading={<ColorIcon icon={StopIcon} size={15} tone="record" />}
                onClick={() => void recording.stop()}
                size="md"
                variant="bright"
              >
                Stop
              </Button>
            ) : (
              <Button
                disabled={!recording.canRecord || recording.locked}
                leading={recording.locked ? <ActivitySpinner size={16} /> : <RecordDot />}
                onClick={() => void recording.start()}
                size="md"
                variant="record"
              >
                {recording.state.status === "stopping" ? "Finalizing" : "Record"}
              </Button>
            )}
            <div
              className={cn(
                "text-fg-3 flex min-w-0 flex-1 items-center gap-2 text-[12.5px]",
                recording.state.status === "failed" && "text-warn-fg"
              )}
            >
              {loading ? <ActivitySpinner size={16} /> : null}
              <span className="min-w-0 truncate">
                <RecordingStatusText
                  activeProjectPath={activeProject?.path}
                  readySources={setupSources.readySources.length}
                  state={recording.state}
                  hasPhone={setupSources.hasPhone}
                  storageAvailable={recording.storageAvailable}
                />
              </span>
            </div>
            <div className="border-control-line bg-track shadow-track flex h-9 items-center gap-2.5 rounded-lg border px-3">
              <ColorIcon icon={Timer01Icon} size={14} tone="menu" />
              <Timecode className="text-[15px]">{timecode(recording.elapsedSeconds)}</Timecode>
            </div>
            <InputMeter
              active={microphoneMeter.active && setupSources.microphoneEnabled}
              enabled={setupSources.microphoneEnabled}
              level={microphoneMeter.level}
              sourceLabel={setupSources.microphoneSource?.label}
            />
          </footer>
        </div>

        <aside className="border-titlebar-line bg-titlebar flex w-[420px] shrink-0 flex-col gap-6 overflow-y-auto border-l px-5 py-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Recording setup</h2>
            <p className="text-fg-3 mt-1 text-[12.5px] leading-[1.5]">
              Each source is saved as its own file. Arrange the layout later in the editor.
            </p>
          </div>

          {recording.locked ? (
            <RecordingSessionPanel
              elapsedSeconds={recording.elapsedSeconds}
              setupSources={setupSources}
            />
          ) : (
            <>
              <SetupSourceControls
                disabled={recording.locked}
                hasPhone={setupSources.hasPhone}
                microphoneRecordingEnabled={setupSources.microphoneRecordingEnabled}
                microphoneMeterActive={microphoneMeter.active}
                microphoneMeterLevel={microphoneMeter.level}
                microphoneSourceId={setupSources.microphoneSource?.id}
                microphoneSources={setupSources.microphoneSources}
                onMicrophoneRecordingEnabledChange={setupSources.setMicrophoneRecordingEnabled}
                onSelectSource={setupSources.selectSource}
                onWebcamRecordingEnabledChange={setupSources.setWebcamRecordingEnabled}
                phoneSourceId={setupSources.phoneSource?.id}
                phoneSources={setupSources.phoneSources}
                webcamRecordingEnabled={setupSources.webcamRecordingEnabled}
                webcamSourceId={setupSources.webcamSource?.id}
                webcamSources={setupSources.webcamSources}
              />

              <Checklist items={[...SETUP_CHECKLIST]} title="Before you start" />
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
type RecordingState = ReturnType<typeof useSetupRecording>["state"];

function RecordingPreviewOverlay({
  elapsedSeconds,
  state,
}: {
  elapsedSeconds: number;
  state: RecordingState;
}) {
  if (state.status === "counting-down") {
    return (
      <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-black/35">
        <div className="text-rec-fg shadow-modal font-ui-mono text-[132px] font-semibold leading-none drop-shadow-[0_18px_38px_rgba(0,0,0,0.55)]">
          {state.value}
        </div>
      </div>
    );
  }

  if (state.status !== "recording" && state.status !== "stopping") return null;

  return (
    <div className="pointer-events-none absolute left-6 top-5 flex items-center gap-2.5">
      <RecordingPill>{state.status === "stopping" ? "Finalizing" : "Recording"}</RecordingPill>
      <div className="border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row rounded-lg border px-3 py-1.5">
        <Timecode className="text-[13px]">{timecode(elapsedSeconds)}</Timecode>
      </div>
    </div>
  );
}

function RecordingStatusText({
  activeProjectPath,
  readySources,
  state,
  hasPhone,
  storageAvailable,
}: {
  activeProjectPath?: string;
  readySources: number;
  state: RecordingState;
  hasPhone: boolean;
  storageAvailable: boolean;
}) {
  if (state.status === "creating-project") return "Preparing project";
  if (state.status === "counting-down") return `Recording starts in ${state.value}`;
  if (state.status === "recording") return `Recording ${readySources} sources`;
  if (state.status === "stopping") return "Finalizing files";
  if (state.status === "failed") return state.message;
  if (!storageAvailable) return "Open ReelDock desktop app to record.";
  if (!hasPhone) return "Waiting for a phone";
  return `${readySources} sources ready - saves to ${activeProjectPath ?? REELDOCK_RECORDINGS_DIR}`;
}

function InputMeter({
  active,
  enabled,
  level,
  sourceLabel,
}: {
  active: boolean;
  enabled: boolean;
  level: number;
  sourceLabel?: string;
}) {
  const status = !enabled || !sourceLabel ? "Off" : active ? "Active" : "No signal";

  return (
    <div className="flex min-w-[230px] items-center gap-2.5">
      <span className="text-fg-hint text-[11px] font-semibold uppercase tracking-[0.1em]">
        Input
      </span>
      <span
        className={cn(
          "block size-1.5 shrink-0 rounded-full",
          active ? "bg-ok" : enabled ? "bg-warn" : "bg-fg-faint"
        )}
      />
      <span className="text-fg-2 max-w-[140px] truncate text-[12px] font-semibold">
        {sourceLabel ?? "No microphone"}
      </span>
      <span className="font-ui-mono text-fg-hint w-[54px] text-[10px] uppercase">
        {status}
      </span>
      <Meter active={active} className="w-[90px]" value={active ? level : 0} />
    </div>
  );
}

function RecordingSessionPanel({
  elapsedSeconds,
  setupSources,
}: {
  elapsedSeconds: number;
  setupSources: SetupSourcesState;
}) {
  const rows = [
    {
      label: "Phone",
      value: setupSources.phoneSource?.label ?? "Required",
      active: setupSources.hasPhone,
    },
    {
      label: "Camera",
      value: setupSources.webcamEnabled ? (setupSources.webcamSource?.label ?? "Camera") : "Off",
      active: setupSources.webcamEnabled,
    },
    {
      label: "Mic",
      value: setupSources.microphoneEnabled
        ? (setupSources.microphoneSource?.label ?? "Microphone")
        : "Muted",
      active: setupSources.microphoneEnabled,
    },
  ];

  return (
    <section>
      <GroupLabel className="mb-2.5">Recording</GroupLabel>
      <div className="border-surface-line bg-surface shadow-panel rounded-[12px] border p-3.5">
        <div className="flex items-center justify-between gap-4">
          <RecordingPill />
          <Timecode className="text-[20px]">{timecode(elapsedSeconds)}</Timecode>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {rows.map((row) => (
            <SurfaceRow
              className="px-3 py-2.5"
              key={row.label}
              tone={row.active ? "ok" : "neutral"}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">{row.label}</div>
                <div className="text-fg-3 mt-0.5 truncate text-[11.5px]">{row.value}</div>
              </div>
            </SurfaceRow>
          ))}
        </div>
      </div>
    </section>
  );
}
