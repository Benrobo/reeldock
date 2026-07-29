import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CameraVideoIcon,
  Mic01Icon,
  SmartPhone01Icon,
  StopIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Button, Meter, RecordingPill, SourceChip, Timecode } from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import type { ColorIconTone } from "@/components/color-icon";
import { timecode } from "@/lib/format";
import { CanvasStage, useStageSize } from "@/modules/canvas";
import { useCaptureSources } from "@/modules/capture";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { useProject } from "@/modules/project";
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

export function RecordingPage() {
  const { ref, size } = useStageSize();
  const navigate = useNavigate();
  const { sources } = useCaptureSources();
  const onboarding = useOnboardingRequirements();
  const activeProject = useProject((state) => state.activeProject);
  const doc = useProject((state) => state.doc);
  const loadProject = useProject((state) => state.loadProject);
  const [seconds, setSeconds] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const availableSources = sources.filter((source) => source.state === "available");

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  useEffect(() => {
    if (activeProject) return;
    let cancelled = false;

    projectsService
      .active()
      .then((project) => {
        if (!cancelled && project) loadProject(project);
      })
      .catch(() => {
        if (!cancelled) setStorageError("Local SQLite storage is unavailable.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject, loadProject]);

  const stopRecording = async () => {
    setStopping(true);
    try {
      const current = activeProject
        ? await projectsService.find(activeProject.id)
        : await projectsService.active();
      if (!current) {
        await navigate({ to: "/" });
        return;
      }
      const saved = await projectsService.saveDoc(current, {
        ...doc,
        dur: Math.max(doc.dur, seconds),
        segments: [{ start: 0, end: Math.max(1, seconds) }],
      });
      const recorded = await projectsService.setStatus(saved, "recorded");
      loadProject(recorded);
      await navigate({ to: "/edit" });
    } catch {
      setStorageError("Could not save the recording because local SQLite is unavailable.");
    } finally {
      setStopping(false);
    }
  };

  return (
    <main className="bg-canvas flex h-full min-w-0 flex-col">
      <header className="border-titlebar-line flex h-14 items-center gap-4 border-b px-6">
        <RecordingPill />
        <Timecode className="text-[22px]">{timecode(seconds)}</Timecode>
        <div className="flex-1" />
        <div className="flex gap-2">
          {availableSources.map((source) => (
            <SourceChip key={source.id} tone="ok">
              <ColorIcon
                icon={sourceIcons[source.kind]}
                size={15}
                tone={sourceTones[source.kind]}
              />
              <span className="text-fg-control text-xs">{source.label}</span>
            </SourceChip>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center p-[30px]" ref={ref}>
        <CanvasStage className="shadow-[var(--shadow-stage)]" size={size} />
      </div>

      <footer className="border-titlebar-line flex h-[92px] items-center gap-5 border-t px-6">
        <Button
          disabled={stopping}
          leading={<ColorIcon icon={StopIcon} size={15} tone="record" />}
          onClick={() => void stopRecording()}
          size="md"
          variant="bright"
        >
          Stop
        </Button>
        <div className="flex flex-col gap-2">
          <span className="text-fg-hint text-[11px] font-semibold uppercase tracking-[0.1em]">
            Microphone
          </span>
          <Meter className="w-[220px]" />
        </div>
        {storageError ? <div className="text-warn-fg text-[12.5px]">{storageError}</div> : null}
        <div className="flex-1" />
        <div className="text-right">
          <div className="text-fg-3 text-xs">Writing to</div>
          <div className="font-ui-mono text-fg-control mt-[3px] text-xs">
            {activeProject?.path ?? "Preparing project"}
          </div>
        </div>
      </footer>
    </main>
  );
}
