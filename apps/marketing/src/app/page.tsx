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
    <main className="bg-night text-paper overflow-hidden">
      <section className="min-h-screen bg-[radial-gradient(circle_at_72%_16%,rgba(122,198,164,0.2),transparent_34%),linear-gradient(140deg,#101713_0%,#182520_48%,#0f1714_100%)] px-[clamp(18px,4vw,64px)] pb-[70px] pt-[22px]">
        <nav
          className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 pb-8 pt-2.5 lg:pb-[54px]"
          aria-label="Main"
        >
          <a className="inline-flex items-center gap-2.5 text-lg font-black" href="#top">
            <span className="bg-dock-400 text-night grid size-9 place-items-center rounded-md">
              <Icon icon={RecordIcon} size={20} color="currentColor" />
            </span>
            ReelDock
          </a>
          <div className="text-muted hidden items-center gap-6 text-sm font-bold md:inline-flex">
            <a href="#workflow">Workflow</a>
            <a href="#formats">Formats</a>
            <a href="#mvp">MVP</a>
          </div>
        </nav>

        <div
          className="mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[minmax(0,0.93fr)_minmax(420px,1.07fr)] lg:gap-[78px]"
          id="top"
        >
          <div className="grid gap-6">
            <p className="text-dock-400 inline-flex w-fit items-center gap-2 text-xs font-black uppercase">
              <Icon icon={AppleIcon} size={16} color="currentColor" />
              macOS recording studio for mobile apps
            </p>
            <h1 className="font-display max-w-[760px] text-6xl font-bold leading-[0.9] sm:text-7xl lg:text-8xl">
              Record your app. Frame your story.
            </h1>
            <p className="text-muted max-w-[620px] text-lg leading-relaxed sm:text-xl">
              ReelDock helps founders and mobile teams capture phone, camera, and voice in one
              session, then turn the walkthrough into a polished launch-ready demo.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                className="bg-dock-400 text-night inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-md px-[18px] font-black sm:w-auto"
                href="#mvp"
              >
                Follow the MVP
                <Icon icon={ArrowRight01Icon} size={18} color="currentColor" />
              </a>
              <a
                className="border-paper/15 bg-paper/5 text-paper inline-flex min-h-12 w-full items-center justify-center rounded-md border px-[18px] font-black sm:w-auto"
                href="#workflow"
              >
                See workflow
              </a>
            </div>
            <div className="grid gap-2.5 sm:flex sm:flex-wrap" aria-label="Product proof points">
              {proofPoints.map((point) => (
                <div
                  className="border-paper/15 bg-paper/5 text-muted inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-extrabold"
                  key={point}
                >
                  <Icon icon={CheckmarkCircle02Icon} size={18} color="currentColor" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div
            className="border-paper/20 from-paper/15 to-paper/5 -mx-2 rounded-xl border bg-gradient-to-b shadow-[0_34px_80px_rgba(0,0,0,0.36)] sm:mx-0"
            aria-label="ReelDock recording preview"
          >
            <div className="border-paper/15 flex min-h-[46px] items-center gap-2 border-b px-4">
              <span className="bg-coral size-2.5 rounded-full" />
              <span className="bg-gold size-2.5 rounded-full" />
              <span className="bg-dock-400 size-2.5 rounded-full" />
              <strong className="text-muted ml-2 text-xs">Elorah Demo.reeldock</strong>
            </div>
            <div className="border-paper/15 relative m-4 min-h-[380px] rounded-lg border bg-[linear-gradient(90deg,rgba(246,240,229,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(246,240,229,0.08)_1px,transparent_1px),#e9eadf] bg-[size:34px_34px] lg:min-h-[430px]">
              <div className="absolute left-7 top-9 grid h-[262px] w-[138px] rounded-[34px] bg-[#141a1f] p-3 shadow-[0_26px_45px_rgba(15,23,20,0.28)] sm:left-[58px] sm:h-[326px] sm:w-[172px]">
                <div className="absolute left-1/2 top-[15px] h-4 w-[58px] -translate-x-1/2 rounded-full bg-[#050706]" />
                <div className="to-dock-100 grid gap-3.5 rounded-[24px] bg-gradient-to-b from-[#fbf7eb] px-4 pb-[18px] pt-[42px]">
                  <div className="bg-dock-700 h-3 w-[70%] rounded-full" />
                  <div className="from-dock-400 to-coral h-24 rounded-[18px] bg-gradient-to-br" />
                  <div className="grid gap-2">
                    <span className="bg-dock-700/60 h-[9px] rounded-full" />
                    <span className="bg-dock-700/60 h-[9px] w-[82%] rounded-full" />
                    <span className="bg-dock-700/60 h-[9px] w-[58%] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="absolute right-6 top-[62px] grid aspect-square w-[132px] place-items-center rounded-full border-[10px] border-[#e9eadf] bg-[radial-gradient(circle_at_48%_35%,#8caed5_0_12%,#2d4049_13%_100%)] font-black text-[#f7f2e8] shadow-[0_22px_38px_rgba(15,23,20,0.22)] sm:right-[52px] sm:top-[54px] sm:w-[216px]">
                <div className="absolute size-[72px] -translate-y-4 rounded-full bg-[#dcb28b]" />
                <span className="relative mb-[42px] self-end">Webcam</span>
              </div>
              <div className="text-night absolute bottom-6 right-5 flex min-h-[54px] items-end gap-2 rounded-md bg-white/80 p-3 shadow-[0_18px_34px_rgba(15,23,20,0.16)] sm:bottom-12 sm:right-12">
                <Icon icon={Mic01Icon} size={18} color="currentColor" />
                <span className="bg-dock-400 h-[18px] w-2.5 rounded-full" />
                <span className="bg-dock-400 h-8 w-2.5 rounded-full" />
                <span className="bg-dock-400 h-[42px] w-2.5 rounded-full" />
                <span className="bg-dock-400 h-6 w-2.5 rounded-full" />
              </div>
            </div>
            <div className="grid gap-2 px-4 pb-4">
              <div className="text-muted grid h-8 grid-cols-[24px_1fr] items-center gap-2.5">
                <Icon icon={SmartPhone01Icon} size={16} color="currentColor" />
                <span className="bg-dock-400 h-[18px] w-[78%] rounded-full" />
              </div>
              <div className="text-muted grid h-8 grid-cols-[24px_1fr] items-center gap-2.5">
                <Icon icon={CameraVideoIcon} size={16} color="currentColor" />
                <span className="bg-info h-[18px] w-[54%] rounded-full" />
              </div>
              <div className="text-muted grid h-8 grid-cols-[24px_1fr] items-center gap-2.5">
                <Icon icon={Mic01Icon} size={16} color="currentColor" />
                <span className="bg-coral h-[18px] w-[68%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-[clamp(18px,4vw,64px)] py-[90px]" id="workflow">
        <div className="mb-8 grid gap-3.5">
          <p className="text-dock-400 inline-flex w-fit items-center gap-2 text-xs font-black uppercase">
            <Icon icon={Video01Icon} size={16} color="currentColor" />
            One session, separate sources
          </p>
          <h2 className="font-display max-w-[760px] text-5xl font-bold leading-none lg:text-6xl">
            Built for product demos, not full timeline editing.
          </h2>
        </div>
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => (
            <article
              className="border-paper/15 bg-paper/5 text-dock-400 grid min-h-[238px] gap-4 rounded-md border p-[22px]"
              key={item.title}
            >
              <Icon icon={item.icon} size={28} color="currentColor" />
              <h3 className="text-paper text-lg font-black leading-tight">{item.title}</h3>
              <p className="text-muted text-[15px] leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mx-auto grid max-w-[1180px] items-start gap-8 px-[clamp(18px,4vw,64px)] py-[90px] lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.8fr)]"
        id="formats"
      >
        <div>
          <p className="text-dock-400 inline-flex w-fit items-center gap-2 text-xs font-black uppercase">
            <Icon icon={Clock03Icon} size={16} color="currentColor" />
            Fast from recording to publish
          </p>
          <h2 className="font-display mt-3.5 max-w-[760px] text-5xl font-bold leading-none lg:text-6xl">
            Export the same walkthrough for every launch surface.
          </h2>
        </div>
        <div className="grid gap-3">
          {ASPECT_RATIOS.map((ratio) => (
            <div
              className="border-paper/15 bg-paper/5 grid min-h-[82px] grid-cols-1 items-center gap-1 rounded-md border p-[18px] sm:grid-cols-[92px_1fr_auto] sm:gap-4"
              key={ratio.id}
            >
              <strong className="text-[28px]">{ratio.id}</strong>
              <span className="text-dock-400 font-black">{ratio.label}</span>
              <small className="text-muted font-extrabold">
                {ratio.width} x {ratio.height}
              </small>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mx-auto mb-20 grid max-w-[1180px] gap-8 px-[clamp(18px,4vw,64px)] py-[90px] lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,0.7fr)]"
        id="mvp"
      >
        <div className="grid content-start gap-4">
          <p className="text-dock-400 inline-flex w-fit items-center gap-2 text-xs font-black uppercase">
            <Icon icon={RecordIcon} size={16} color="currentColor" />
            MVP definition
          </p>
          <h2 className="font-display max-w-[760px] text-5xl font-bold leading-none lg:text-6xl">
            First prove capture reliability. Then polish the editor.
          </h2>
          <p className="text-muted max-w-[620px] text-lg leading-relaxed sm:text-xl">
            The launch version stays focused: connected iPhone capture, webcam, microphone,
            synchronized source files, layout presets, trim, and local MP4 export.
          </p>
        </div>
        <div className="grid content-start gap-2.5">
          {LAYOUT_PRESETS.map((preset) => (
            <div className="border-paper/15 bg-paper/5 rounded-md border p-4" key={preset.id}>
              <span className="text-dock-400 mb-1.5 block font-black">{preset.label}</span>
              <p className="text-muted text-[15px] leading-relaxed">{preset.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
