import { Icon } from "@benrobo/iconary/react";
import type { IconData } from "@benrobo/iconary/core";
import {
  CameraVideoIcon,
  Mic01Icon,
  MonitorDotIcon,
  Plug01Icon,
  RecordIcon,
  Scissor01Icon,
  Settings01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { createEmptyProject } from "@reeldock/project-schema";
import {
  ASPECT_RATIOS,
  LAYOUT_PRESETS,
  MVP_PHASES,
  type CaptureSource,
  type CaptureSourceState,
  type LayoutPresetId,
} from "@reeldock/shared";
import {
  Button,
  ChoiceCard,
  EmptyState,
  Panel,
  PanelLabel,
  RecordDot,
  SettingsList,
  SettingsRow,
  StatusPill,
  SurfaceRow,
  type Rect,
  type StatusTone,
} from "@reeldock/ui";

const fallbackSources: CaptureSource[] = [
  {
    id: "iphone-usb",
    label: "iPhone USB capture",
    kind: "phone",
    state: "unavailable",
  },
  {
    id: "facetime-camera",
    label: "Webcam",
    kind: "webcam",
    state: "permission-required",
  },
  {
    id: "default-microphone",
    label: "Microphone",
    kind: "microphone",
    state: "permission-required",
  },
];

const sourceIcon = {
  phone: SmartPhone01Icon,
  webcam: CameraVideoIcon,
  microphone: Mic01Icon,
} satisfies Record<CaptureSource["kind"], IconData>;

const sourceTone = {
  available: "ok",
  "permission-required": "warn",
  unavailable: "neutral",
} satisfies Record<CaptureSourceState, StatusTone>;

const layoutGeometry = {
  "phone-focus": {
    phone: { x: 38, y: 5, w: 23, h: 90 },
    camera: { x: 0, y: 0, w: 0, h: 0 },
  },
  "side-by-side": {
    phone: { x: 7, y: 10, w: 21, h: 80 },
    camera: { x: 40, y: 24, w: 52, h: 52, radius: 3 },
  },
  "picture-in-picture": {
    phone: { x: 38, y: 5, w: 23, h: 90 },
    camera: { x: 68, y: 58, w: 19, h: 34, radius: 11 },
  },
  "vertical-demo": {
    phone: { x: 30, y: 2, w: 40, h: 96 },
    camera: { x: 74, y: 70, w: 20, h: 26, radius: 10 },
  },
} satisfies Record<LayoutPresetId, { phone: Rect; camera: Rect }>;

const navItems = [
  { label: "Record", icon: RecordIcon },
  { label: "Editor", icon: Scissor01Icon },
  { label: "Preferences", icon: Settings01Icon },
];

export function App() {
  const [sources, setSources] = useState<CaptureSource[]>(fallbackSources);
  const [layout, setLayout] = useState<LayoutPresetId>(LAYOUT_PRESETS[0].id);
  const draftProject = useMemo(() => createEmptyProject("Elorah Reading Plan Demo"), []);

  useEffect(() => {
    invoke<CaptureSource[]>("list_capture_sources")
      .then(setSources)
      .catch(() => setSources(fallbackSources));
  }, []);

  return (
    <main className="bg-canvas font-ui text-fg grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-surface-line bg-window hidden flex-col gap-[30px] border-r px-5 py-7 lg:flex">
        <div className="flex items-center gap-3.5">
          <div className="border-group-line bg-raised-alt-top text-rec grid size-[46px] place-items-center rounded-[14px] border">
            <Icon color="currentColor" icon={MonitorDotIcon} size={22} />
          </div>
          <div>
            <PanelLabel>MVP workspace</PanelLabel>
            <h1 className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.022em]">
              ReelDock
            </h1>
          </div>
        </div>

        <nav aria-label="Primary" className="grid gap-1.5">
          {navItems.map((item, index) => (
            <button
              className={
                index === 0
                  ? "rd-press border-accent bg-linear-to-b from-accent/[18%] to-accent/[7%] text-fg shadow-selected flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 text-[13px] font-semibold"
                  : "rd-press text-fg-2 hover:text-fg flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-transparent px-3 text-[13px] font-medium hover:bg-white/[5.5%]"
              }
              key={item.label}
              type="button"
            >
              <Icon color="currentColor" icon={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <section aria-label="MVP phases" className="mt-auto grid gap-2.5">
          {MVP_PHASES.map((phase, index) => (
            <div
              className="text-fg-3 grid grid-cols-[28px_1fr] items-center gap-2.5 text-[12px]"
              key={phase}
            >
              <span className="border-well-line bg-well font-ui-mono text-fg-control shadow-well grid size-7 place-items-center rounded-full border text-[11px]">
                {index + 1}
              </span>
              <p>{phase}</p>
            </div>
          ))}
        </section>
      </aside>

      <section className="flex min-w-0 flex-col gap-6 p-5 sm:p-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <PanelLabel>Recording setup</PanelLabel>
            <h2 className="mt-1.5 max-w-[760px] text-[26px] font-semibold leading-tight tracking-[-0.022em]">
              Connect sources before recording
            </h2>
          </div>
          <Button leading={<RecordDot />} variant="record">
            Record
          </Button>
        </header>

        <section className="grid min-h-0 gap-6 xl:grid-cols-[minmax(520px,1fr)_390px]">
          <div className="border-surface-line bg-surface shadow-panel grid min-h-[420px] place-items-center rounded-[14px] border p-6 xl:min-h-[640px]">
            <EmptyState className="aspect-video w-[min(88%,760px)]" title="No sources connected">
              Connect an iPhone over USB, then press Record to fill this canvas.
            </EmptyState>
          </div>

          <div className="grid content-start gap-4">
            <Panel className="p-0">
              <div className="border-surface-line text-fg-2 flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon color="currentColor" icon={Plug01Icon} size={18} />
                <PanelLabel>Sources</PanelLabel>
              </div>
              <div className="grid gap-2.5 p-3.5">
                {sources.map((source) => (
                  <SurfaceRow key={source.id} tone={sourceTone[source.state]}>
                    <Icon color="currentColor" icon={sourceIcon[source.kind]} size={20} />
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold">{source.label}</div>
                      <div className="text-fg-3 mt-px text-[11.5px]">
                        {source.state.replace("-", " ")}
                      </div>
                    </div>
                  </SurfaceRow>
                ))}
              </div>
            </Panel>

            <Panel className="p-0">
              <div className="border-surface-line text-fg-2 flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon color="currentColor" icon={MonitorDotIcon} size={18} />
                <PanelLabel>Layout presets</PanelLabel>
              </div>
              <div className="grid grid-cols-2 gap-2.5 p-3.5">
                {LAYOUT_PRESETS.map((preset) => (
                  <ChoiceCard
                    camera={layoutGeometry[preset.id].camera}
                    key={preset.id}
                    label={preset.label}
                    onSelect={() => setLayout(preset.id)}
                    phone={layoutGeometry[preset.id].phone}
                    selected={layout === preset.id}
                  />
                ))}
              </div>
            </Panel>

            <Panel className="p-0">
              <div className="border-surface-line text-fg-2 flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon color="currentColor" icon={Settings01Icon} size={18} />
                <PanelLabel>Project contract</PanelLabel>
              </div>
              <div className="p-3.5">
                <SettingsList>
                  <SettingsRow label="Project">
                    <span className="text-[13px] font-semibold">{draftProject.name}</span>
                  </SettingsRow>
                  <SettingsRow label="Canvas">
                    <span className="font-ui-mono text-fg-value text-[12px]">
                      {draftProject.canvas.width} × {draftProject.canvas.height}
                    </span>
                  </SettingsRow>
                  <SettingsRow label="Ratios">
                    <div className="flex gap-1.5">
                      {ASPECT_RATIOS.map((ratio) => (
                        <StatusPill key={ratio.id} tone="neutral">
                          {ratio.id}
                        </StatusPill>
                      ))}
                    </div>
                  </SettingsRow>
                </SettingsList>
              </div>
            </Panel>
          </div>
        </section>
      </section>
    </main>
  );
}
