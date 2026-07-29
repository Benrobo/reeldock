import { Icon } from "@benrobo/iconary/react";
import {
  AppleIcon,
  ArrowRight01Icon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  Clock03Icon,
  FolderExportIcon,
  Mic01Icon,
  RecordIcon,
  Scissor01Icon,
  SmartPhone01Icon,
  Video01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { ASPECT_RATIOS, LAYOUT_PRESETS } from "@reeldock/shared";

const proofPoints = [
  "Separate phone, webcam, and microphone tracks",
  "Layout-first editor for app demos",
  "Local MP4 export for launch assets",
] as const;

const workflow = [
  {
    icon: SmartPhone01Icon,
    title: "Connect the phone",
    body: "Record the live app directly from a USB-connected iPhone on your Mac.",
  },
  {
    icon: CameraVideoIcon,
    title: "Capture the presenter",
    body: "Add webcam and narration without baking them into the phone recording.",
  },
  {
    icon: Scissor01Icon,
    title: "Frame the story",
    body: "Trim, resize, reposition, and swap canvas ratios after the walkthrough.",
  },
  {
    icon: FolderExportIcon,
    title: "Export the demo",
    body: "Render a polished H.264 MP4 for landing pages, social clips, or support.",
  },
] as const;

export default function MarketingPage() {
  return (
    <main>
      <section className="hero-section">
        <nav className="site-nav" aria-label="Main">
          <a className="brand" href="#top">
            <span className="brand-icon">
              <Icon icon={RecordIcon} size={20} color="currentColor" />
            </span>
            ReelDock
          </a>
          <div className="nav-links">
            <a href="#workflow">Workflow</a>
            <a href="#formats">Formats</a>
            <a href="#mvp">MVP</a>
          </div>
        </nav>

        <div className="hero-grid" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <Icon icon={AppleIcon} size={16} color="currentColor" />
              macOS recording studio for mobile apps
            </p>
            <h1>Record your app. Frame your story.</h1>
            <p className="hero-lede">
              ReelDock helps founders and mobile teams capture phone, camera, and voice in one
              session, then turn the walkthrough into a polished launch-ready demo.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#mvp">
                Follow the MVP
                <Icon icon={ArrowRight01Icon} size={18} color="currentColor" />
              </a>
              <a className="secondary-action" href="#workflow">
                See workflow
              </a>
            </div>
            <div className="proof-list" aria-label="Product proof points">
              {proofPoints.map((point) => (
                <div className="proof-item" key={point}>
                  <Icon icon={CheckmarkCircle02Icon} size={18} color="currentColor" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="studio-visual" aria-label="ReelDock recording preview">
            <div className="studio-toolbar">
              <span />
              <span />
              <span />
              <strong>Elorah Demo.reeldock</strong>
            </div>
            <div className="studio-canvas">
              <div className="phone-device">
                <div className="phone-notch" />
                <div className="app-screen">
                  <div className="screen-header" />
                  <div className="screen-card large" />
                  <div className="screen-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
              <div className="webcam-window">
                <div className="webcam-face" />
                <span>Webcam</span>
              </div>
              <div className="audio-meter">
                <Icon icon={Mic01Icon} size={18} color="currentColor" />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="timeline-strip">
              <div className="track phone">
                <Icon icon={SmartPhone01Icon} size={16} color="currentColor" />
                <span />
              </div>
              <div className="track camera">
                <Icon icon={CameraVideoIcon} size={16} color="currentColor" />
                <span />
              </div>
              <div className="track audio">
                <Icon icon={Mic01Icon} size={16} color="currentColor" />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-heading">
          <p className="eyebrow">
            <Icon icon={Video01Icon} size={16} color="currentColor" />
            One session, separate sources
          </p>
          <h2>Built for product demos, not full timeline editing.</h2>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article className="workflow-card" key={item.title}>
              <Icon icon={item.icon} size={28} color="currentColor" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="formats-section" id="formats">
        <div>
          <p className="eyebrow">
            <Icon icon={Clock03Icon} size={16} color="currentColor" />
            Fast from recording to publish
          </p>
          <h2>Export the same walkthrough for every launch surface.</h2>
        </div>
        <div className="format-grid">
          {ASPECT_RATIOS.map((ratio) => (
            <div className="format-card" key={ratio.id}>
              <strong>{ratio.id}</strong>
              <span>{ratio.label}</span>
              <small>
                {ratio.width} x {ratio.height}
              </small>
            </div>
          ))}
        </div>
      </section>

      <section className="mvp-section" id="mvp">
        <div className="mvp-copy">
          <p className="eyebrow">
            <Icon icon={RecordIcon} size={16} color="currentColor" />
            MVP definition
          </p>
          <h2>First prove capture reliability. Then polish the editor.</h2>
          <p>
            The launch version stays focused: connected iPhone capture, webcam, microphone,
            synchronized source files, layout presets, trim, and local MP4 export.
          </p>
        </div>
        <div className="preset-list">
          {LAYOUT_PRESETS.map((preset) => (
            <div className="preset-row" key={preset.id}>
              <span>{preset.label}</span>
              <p>{preset.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
