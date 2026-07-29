import { Icon } from "@benrobo/iconary/react";
import type { IconData } from "@benrobo/iconary/core";
import {
  CameraVideoIcon,
  CircleIcon,
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
import { ASPECT_RATIOS, LAYOUT_PRESETS, MVP_PHASES, type CaptureSource } from "@reeldock/shared";

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

export function App() {
  const [sources, setSources] = useState<CaptureSource[]>(fallbackSources);
  const draftProject = useMemo(() => createEmptyProject("Elorah Reading Plan Demo"), []);

  useEffect(() => {
    invoke<CaptureSource[]>("list_capture_sources")
      .then(setSources)
      .catch(() => setSources(fallbackSources));
  }, []);

  return (
    <main className="from-panel-warm to-dock-100 text-ink grid min-h-screen grid-cols-1 bg-gradient-to-b lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-line bg-panel/85 hidden flex-col gap-[30px] border-r px-5 py-7 lg:flex">
        <div className="flex items-center gap-3.5">
          <div className="bg-dock-700 grid size-[46px] place-items-center rounded-md text-white shadow-[inset_0_-10px_18px_rgba(0,0,0,0.18)]">
            <Icon icon={MonitorDotIcon} size={22} color="currentColor" />
          </div>
          <div>
            <p className="text-muted mb-1 text-xs font-bold uppercase">MVP workspace</p>
            <h1 className="text-2xl font-black leading-none">ReelDock</h1>
          </div>
        </div>

        <nav className="grid gap-2" aria-label="Primary">
          <button
            className="border-line bg-panel text-ink flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-md border px-3"
            type="button"
          >
            <Icon icon={RecordIcon} size={18} color="currentColor" />
            Record
          </button>
          <button
            className="text-muted flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-md border border-transparent bg-transparent px-3"
            type="button"
          >
            <Icon icon={Scissor01Icon} size={18} color="currentColor" />
            Editor
          </button>
          <button
            className="text-muted flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-md border border-transparent bg-transparent px-3"
            type="button"
          >
            <Icon icon={Settings01Icon} size={18} color="currentColor" />
            Preferences
          </button>
        </nav>

        <section className="mt-auto grid gap-2.5" aria-label="MVP phases">
          {MVP_PHASES.map((phase, index) => (
            <div
              className="text-muted grid grid-cols-[28px_1fr] items-center gap-2.5 text-[13px]"
              key={phase}
            >
              <span className="border-line bg-panel text-dock-700 grid size-7 place-items-center rounded-full border font-bold">
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
            <p className="text-muted mb-1 text-xs font-bold uppercase">Recording setup</p>
            <h2 className="max-w-[760px] text-3xl font-black leading-tight">
              Connect sources before recording
            </h2>
          </div>
          <button
            className="bg-coral inline-flex h-11 min-w-[126px] cursor-pointer items-center justify-center gap-2.5 rounded-md border-0 px-[18px] font-extrabold text-white"
            type="button"
          >
            <Icon icon={CircleIcon} size={18} color="currentColor" />
            Record
          </button>
        </header>

        <section className="grid min-h-0 gap-6 xl:grid-cols-[minmax(520px,1fr)_390px]">
          <div className="border-line from-aqua/55 to-panel/70 grid min-h-[420px] place-items-center rounded-md border bg-gradient-to-br xl:min-h-[640px]">
            <div className="border-ink/15 bg-panel-warm relative aspect-video w-[min(78%,760px)] rounded-md border shadow-[0_26px_70px_rgba(41,56,67,0.2)]">
              <div className="absolute left-[9%] top-[7%] grid h-[86%] w-[30%] rounded-[34px] bg-[#171b1f] p-2.5">
                <div className="grid place-items-center rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_22%),linear-gradient(160deg,var(--color-dock-700),var(--color-steel)_60%,#171b1f)] font-extrabold text-[#e9fbf4]">
                  <span>Phone preview</span>
                </div>
              </div>
              <div className="border-panel-warm bg-steel absolute bottom-[14%] right-[10%] grid aspect-square w-[28%] place-items-center rounded-full border-8 font-extrabold text-white shadow-[0_18px_38px_rgba(41,56,67,0.2)]">
                Camera
              </div>
            </div>
          </div>

          <div className="grid content-start gap-4">
            <section className="border-line bg-panel/90 rounded-md border">
              <div className="border-line flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon icon={Plug01Icon} size={18} color="currentColor" />
                <h3 className="text-[15px] font-black">Sources</h3>
              </div>
              <div className="grid gap-2.5 p-3.5">
                {sources.map((source) => {
                  const icon = sourceIcon[source.kind];

                  return (
                    <div
                      className="border-line bg-panel grid min-h-14 grid-cols-[24px_1fr] items-center gap-3 rounded-md border px-3"
                      key={source.id}
                    >
                      <Icon icon={icon} size={20} color="currentColor" />
                      <div className="grid gap-1">
                        <strong className="text-sm">{source.label}</strong>
                        <span className="text-muted text-xs">{source.state.replace("-", " ")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border-line bg-panel/90 rounded-md border">
              <div className="border-line flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon icon={MonitorDotIcon} size={18} color="currentColor" />
                <h3 className="text-[15px] font-black">Layout presets</h3>
              </div>
              <div className="grid gap-2.5 p-3.5">
                {LAYOUT_PRESETS.map((preset, index) => (
                  <button
                    className={[
                      "text-ink grid min-h-16 cursor-pointer gap-1 rounded-md border p-3 text-left",
                      index === 0 ? "border-dock-700/40 bg-dock-50" : "border-line bg-panel",
                    ].join(" ")}
                    key={preset.id}
                    type="button"
                  >
                    <strong className="text-sm">{preset.label}</strong>
                    <span className="text-muted text-xs">{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="border-line bg-panel/90 rounded-md border">
              <div className="border-line flex min-h-12 items-center gap-2.5 border-b px-4">
                <Icon icon={Settings01Icon} size={18} color="currentColor" />
                <h3 className="text-[15px] font-black">Project contract</h3>
              </div>
              <dl className="m-0 grid gap-2.5 p-3.5">
                <div className="border-line flex justify-between gap-5 border-b pb-2.5">
                  <dt className="text-muted text-xs">Project</dt>
                  <dd className="text-ink m-0 text-right text-[13px] font-bold">
                    {draftProject.name}
                  </dd>
                </div>
                <div className="border-line flex justify-between gap-5 border-b pb-2.5">
                  <dt className="text-muted text-xs">Canvas</dt>
                  <dd className="text-ink m-0 text-right text-[13px] font-bold">
                    {draftProject.canvas.width} x {draftProject.canvas.height}
                  </dd>
                </div>
                <div className="flex justify-between gap-5">
                  <dt className="text-muted text-xs">Ratios</dt>
                  <dd className="text-ink m-0 text-right text-[13px] font-bold">
                    {ASPECT_RATIOS.map((ratio) => ratio.id).join(", ")}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
