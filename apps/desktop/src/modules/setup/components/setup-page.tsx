import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plug01Icon } from "@benrobo/iconary/core/duotone-rounded";
import { ActivitySpinner, Banner, Button, Checklist, Meter, RecordDot } from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import { CapturePreview } from "@/modules/canvas";
import { useCaptureSources } from "@/modules/capture";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { useProject } from "@/modules/project";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import { SETUP_CHECKLIST } from "@/constants/recording";
import { projectsService } from "@/services";
import { SetupSourceControls } from "./setup-source-controls";
import { useSetupSources } from "../hooks/use-setup-sources";

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
  const setupSources = useSetupSources(sources);

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  const startRecording = async () => {
    if (!onboarding.complete) {
      await navigate({ to: "/permissions" });
      return;
    }

    setStarting(true);
    try {
      const current = activeProject ? await projectsService.find(activeProject.id) : null;
      const draft =
        current ??
        (await projectsService.create({
          sources: setupSources.recordingSources,
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

        <div className="flex min-h-0 flex-1 items-stretch justify-stretch">
          <CapturePreview
            phoneDimensions={setupSources.phoneSource}
            phoneUniqueId={setupSources.hasPhone ? setupSources.phoneSource?.uniqueId : undefined}
            webcamUniqueId={
              setupSources.webcamEnabled ? setupSources.webcamSource?.uniqueId : undefined
            }
          />
        </div>

        <footer className="border-titlebar-line bg-titlebar flex h-[84px] items-center gap-5 border-t px-7">
          <Button
            disabled={
              !setupSources.hasPhone || starting || onboarding.loading || !onboarding.complete
            }
            leading={starting ? <ActivitySpinner size={16} /> : <RecordDot />}
            onClick={() => void startRecording()}
            size="md"
            variant="record"
          >
            Record
          </Button>
          <div className="text-fg-3 flex items-center gap-2 text-[12.5px]">
            {loading ? <ActivitySpinner size={16} /> : null}
            {setupSources.hasPhone
              ? `${setupSources.readySources.length} sources ready - saves to ${REELDOCK_RECORDINGS_DIR}`
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

      <aside className="border-titlebar-line bg-titlebar flex w-[420px] shrink-0 flex-col gap-6 overflow-y-auto border-l px-5 py-5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Recording setup</h2>
          <p className="text-fg-3 mt-1 text-[12.5px] leading-[1.5]">
            Each source is saved as its own file. Arrange the layout later in the editor.
          </p>
        </div>

        <SetupSourceControls
          hasPhone={setupSources.hasPhone}
          microphoneRecordingEnabled={setupSources.microphoneRecordingEnabled}
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
      </aside>
    </main>
  );
}
