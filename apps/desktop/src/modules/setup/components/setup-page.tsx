import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CameraVideoIcon,
  Mic01Icon,
  Plug01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Banner,
  Button,
  Checklist,
  GroupLabel,
  Meter,
  RecordDot,
  Segmented,
  SourceChip,
  Switch,
} from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import type { ColorIconTone } from "@/components/color-icon";
import { CanvasStage, useStageSize } from "@/modules/canvas";
import { useCaptureSources } from "@/modules/capture";
import { useOnboardingRequirements } from "@/modules/onboarding";
import { LayoutGrid, useProject } from "@/modules/project";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import {
  RECORDING_QUALITY_LABEL,
  SETUP_CHECKLIST,
} from "@/constants/recording";
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

function canvasRatioFromLabel(label: string) {
  return label === "Custom" ? "custom" : (label as "16:9" | "9:16" | "1:1");
}

export function SetupPage() {
  const { ref, size } = useStageSize();
  const navigate = useNavigate();
  const { sources, loading } = useCaptureSources();
  const onboarding = useOnboardingRequirements();
  const activeProject = useProject((state) => state.activeProject);
  const doc = useProject((state) => state.doc);
  const update = useProject((state) => state.update);
  const loadProject = useProject((state) => state.loadProject);
  const setActiveProject = useProject((state) => state.setActiveProject);
  const [starting, setStarting] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [enabledSourceIds, setEnabledSourceIds] = useState<Set<string>>(
    new Set()
  );
  const hasPhone = sources.some(
    (source) => source.kind === "phone" && source.state === "available"
  );
  const readySources = sources.filter(
    (source) => source.state === "available" && enabledSourceIds.has(source.id)
  );

  useEffect(() => {
    setEnabledSourceIds(
      new Set(
        sources
          .filter((source) => source.state === "available")
          .map((source) => source.id)
      )
    );
  }, [sources]);

  useEffect(() => {
    if (onboarding.loading || onboarding.complete) return;
    void navigate({ to: "/permissions" });
  }, [navigate, onboarding.complete, onboarding.loading]);

  const setSourceEnabled = (sourceId: string, enabled: boolean) => {
    setEnabledSourceIds((current) => {
      const next = new Set(current);
      if (enabled) next.add(sourceId);
      else next.delete(sourceId);
      return next;
    });
  };

  const startRecording = async () => {
    if (!onboarding.complete) {
      await navigate({ to: "/permissions" });
      return;
    }

    setStarting(true);
    try {
      const current = activeProject
        ? await projectsService.find(activeProject.id)
        : null;
      const draft =
        current ??
        (await projectsService.create({
          sources: sources.map((source) => ({
            kind: source.kind,
            label: source.label,
            enabled:
              source.state === "available" && enabledSourceIds.has(source.id),
          })),
        }));
      const saved = await projectsService.saveDoc(draft, doc);
      const recording = await projectsService.setStatus(saved, "recording");
      loadProject(recording);
      setActiveProject(recording);
      await navigate({ to: "/record" });
    } catch {
      setStorageError(
        "Local SQLite storage is required before recording can start."
      );
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
                leading={<ColorIcon icon={Plug01Icon} size={14} tone="plug" />}
                size="mini"
              >
                Look again
              </Button>
            }
            className="rounded-none border-x-0 border-t-0 px-5"
            tone="warn"
          >
            No iPhone found. Connect it with a cable, unlock it, and tap Trust
            This Computer.
          </Banner>
        ) : null}

        <div
          className="flex min-h-0 flex-1 items-center justify-center p-8"
          ref={ref}
        >
          {hasPhone ? (
            <CanvasStage size={size} />
          ) : (
            <div className="border-dash bg-surface flex h-[360px] w-[640px] flex-col items-center justify-center gap-3.5 rounded-[10px] border border-dashed">
              <ColorIcon icon={SmartPhone01Icon} size={46} tone="phone" />
              <div className="text-fg-control text-[15px] font-semibold">
                No phone connected
              </div>
              <p className="text-fg-3 max-w-[280px] text-center text-[13px] leading-[1.5]">
                Plug an iPhone into this Mac. It appears here within a few
                seconds.
              </p>
            </div>
          )}
        </div>

        <footer className="border-titlebar-line bg-titlebar flex h-[84px] items-center gap-5 border-t px-7">
          <Button
            disabled={
              !hasPhone ||
              starting ||
              onboarding.loading ||
              !onboarding.complete
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
            {hasPhone
              ? `${readySources.length} sources ready - saves to ${REELDOCK_RECORDINGS_DIR}`
              : "Waiting for a phone"}
          </div>
          {storageError ? (
            <div className="text-warn-fg text-[12.5px]">{storageError}</div>
          ) : null}
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
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
            Recording setup
          </h2>
          <p className="text-fg-3 mt-1 text-[12.5px] leading-[1.5]">
            Each source is saved as its own file, so you can rearrange
            everything afterwards.
          </p>
        </div>

        <section>
          <GroupLabel className="mb-2.5">Sources</GroupLabel>
          <div className="flex flex-col gap-2">
            {sources.map((source) => (
              <SourceChip
                key={source.id}
                tone={source.state === "available" ? "ok" : "warn"}
              >
                <ColorIcon
                  icon={sourceIcons[source.kind]}
                  size={16}
                  tone={sourceTones[source.kind]}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">
                    {source.label}
                  </div>
                  <div className="text-fg-3 mt-px text-[11.5px]">
                    {source.kind}
                  </div>
                </div>
                {source.kind === "webcam" ? (
                  <Switch
                    checked={enabledSourceIds.has(source.id)}
                    label="Camera"
                    onChange={(camOn) => {
                      setSourceEnabled(source.id, camOn);
                      update({ camOn });
                    }}
                  />
                ) : null}
              </SourceChip>
            ))}
          </div>
        </section>

        <section>
          <GroupLabel className="mb-2.5">Layout</GroupLabel>
          <LayoutGrid
            onChange={(layout) =>
              update({
                layout,
                ratio: layout === "vertical" ? "9:16" : doc.ratio,
              })
            }
            value={doc.layout}
          />
        </section>

        <section>
          <GroupLabel className="mb-2.5">Canvas</GroupLabel>
          <Segmented
            onChange={(ratio) => update({ ratio: canvasRatioFromLabel(ratio) })}
            options={["16:9", "9:16", "1:1", "Custom"]}
            value={doc.ratio === "custom" ? "Custom" : doc.ratio}
          />
          <div className="mt-3.5 flex items-center justify-between">
            <span className="text-fg-2 text-[12.5px]">Quality</span>
            <span className="text-[12.5px] font-semibold">
              {RECORDING_QUALITY_LABEL}
            </span>
          </div>
        </section>

        <Checklist items={[...SETUP_CHECKLIST]} title="Before you start" />
      </aside>
    </main>
  );
}
