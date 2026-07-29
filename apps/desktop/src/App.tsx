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
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Icon icon={MonitorDotIcon} size={22} color="currentColor" />
          </div>
          <div>
            <p className="eyebrow">MVP workspace</p>
            <h1>ReelDock</h1>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Primary">
          <button className="nav-item active" type="button">
            <Icon icon={RecordIcon} size={18} color="currentColor" />
            Record
          </button>
          <button className="nav-item" type="button">
            <Icon icon={Scissor01Icon} size={18} color="currentColor" />
            Editor
          </button>
          <button className="nav-item" type="button">
            <Icon icon={Settings01Icon} size={18} color="currentColor" />
            Preferences
          </button>
        </nav>

        <section className="phase-list" aria-label="MVP phases">
          {MVP_PHASES.map((phase, index) => (
            <div className="phase-row" key={phase}>
              <span>{index + 1}</span>
              <p>{phase}</p>
            </div>
          ))}
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Recording setup</p>
            <h2>Connect sources before recording</h2>
          </div>
          <button className="record-button" type="button">
            <Icon icon={CircleIcon} size={18} color="currentColor" />
            Record
          </button>
        </header>

        <section className="setup-grid">
          <div className="preview-pane">
            <div className="canvas-preview">
              <div className="phone-frame">
                <div className="phone-screen">
                  <span>Phone preview</span>
                </div>
              </div>
              <div className="camera-bubble">Camera</div>
            </div>
          </div>

          <div className="control-column">
            <section className="panel">
              <div className="panel-heading">
                <Icon icon={Plug01Icon} size={18} color="currentColor" />
                <h3>Sources</h3>
              </div>
              <div className="source-list">
                {sources.map((source) => {
                  const icon = sourceIcon[source.kind];

                  return (
                    <div className="source-row" key={source.id}>
                      <Icon icon={icon} size={20} color="currentColor" />
                      <div>
                        <strong>{source.label}</strong>
                        <span>{source.state.replace("-", " ")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <Icon icon={MonitorDotIcon} size={18} color="currentColor" />
                <h3>Layout presets</h3>
              </div>
              <div className="preset-grid">
                {LAYOUT_PRESETS.map((preset) => (
                  <button className="preset-button" key={preset.id} type="button">
                    <strong>{preset.label}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <Icon icon={Settings01Icon} size={18} color="currentColor" />
                <h3>Project contract</h3>
              </div>
              <dl className="contract-list">
                <div>
                  <dt>Project</dt>
                  <dd>{draftProject.name}</dd>
                </div>
                <div>
                  <dt>Canvas</dt>
                  <dd>
                    {draftProject.canvas.width} x {draftProject.canvas.height}
                  </dd>
                </div>
                <div>
                  <dt>Ratios</dt>
                  <dd>{ASPECT_RATIOS.map((ratio) => ratio.id).join(", ")}</dd>
                </div>
              </dl>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
