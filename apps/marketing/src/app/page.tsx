"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { IconData } from "@benrobo/iconary/core";
import { Icon } from "@benrobo/iconary/react";
import {
  AppleIcon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  Clock03Icon,
  Mic01Icon,
  PlayIcon,
  Plug01Icon,
  QuestionIcon,
  RecordIcon,
  SmartPhone01Icon,
  Video01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  Button,
  Panel,
  PanelLabel,
  Segmented,
  TextField,
  Timecode,
  TransportButton,
} from "@reeldock/ui";
import {
  aspectRatios,
  facts,
  faqs,
  features,
  needs,
  notYet,
  phoneRows,
  steps,
} from "./landing-data";

const sourceTracks = [
  {
    icon: SmartPhone01Icon,
    label: "Phone",
    file: "phone.mov",
    cells: Array.from({ length: 20 }, (_, index) => ({
      className: "h-[34px] w-4 rounded-[3px] bg-screen-track",
      opacity: 0.45 + ((index * 7) % 5) / 12,
    })),
  },
  {
    icon: CameraVideoIcon,
    label: "Camera",
    file: "webcam.mov",
    cells: Array.from({ length: 20 }, (_, index) => ({
      className: "size-[30px] rounded-full border border-control-line bg-control-line",
      opacity: 0.6 + ((index * 3) % 5) / 12,
    })),
  },
  {
    icon: Mic01Icon,
    label: "Microphone",
    file: "microphone.m4a",
    cells: Array.from({ length: 72 }, (_, index) => ({
      className: "w-0.5 rounded-full bg-accent",
      height: `${Math.max(6, Math.abs(Math.sin(index * 0.9) * 30 + Math.cos(index * 0.31) * 13))}px`,
      opacity: 0.85,
    })),
  },
] as const;

const timelineBars = Array.from({ length: 46 }, (_, index) => ({
  className:
    index >= 34 && index <= 39 ? "bg-raised-alt-top" : index < 12 ? "bg-accent" : "bg-thumb-line",
  height: `${28 + Math.sin(index * 1.7) * 9 + Math.cos(index * 0.8) * 5}%`,
}));

const ratioOptions = aspectRatios.map((ratio) => ratio.id);

export default function MarketingPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [ratioId, setRatioId] = useState<string>(aspectRatios[0].id);
  const [openFaq, setOpenFaq] = useState(0);
  const activeRatio = useMemo(
    () => aspectRatios.find((ratio) => ratio.id === ratioId) ?? aspectRatios[0],
    [ratioId]
  );

  function joinWaitlist() {
    if (/.+@.+\..+/.test(email)) {
      setJoined(true);
    }
  }

  function focusWaitlist() {
    const input = document.getElementById("waitlist-email");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <main className="bg-canvas text-fg min-h-screen overflow-hidden">
      <nav className="border-titlebar-line bg-canvas/85 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1160px] items-center gap-7 px-[clamp(18px,4vw,28px)]">
          <a className="text-fg hover:text-fg inline-flex items-center gap-[9px]" href="#top">
            <span className="bg-linear-to-b from-accent-top to-accent-bottom text-fg shadow-accent grid size-[25px] place-items-center rounded-[7px]">
              <Icon icon={RecordIcon} size={16} color="currentColor" />
            </span>
            <span className="text-[15.5px] font-semibold">ReelDock</span>
          </a>
          <div className="text-fg-2 hidden flex-1 items-center justify-end gap-6 text-[13.5px] md:flex">
            <a className="text-fg-2 hover:text-accent-link-hover" href="#how">
              How it works
            </a>
            <a className="text-fg-2 hover:text-accent-link-hover" href="#sources">
              Sources
            </a>
            <a className="text-fg-2 hover:text-accent-link-hover" href="#formats">
              Formats
            </a>
            <a className="text-fg-2 hover:text-accent-link-hover" href="#faq">
              Questions
            </a>
          </div>
          <Button
            className="ml-auto hidden md:inline-flex"
            onClick={focusWaitlist}
            size="md"
            variant="accent"
          >
            Join the waitlist
          </Button>
        </div>
      </nav>

      <section
        className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-[72px] text-center"
        id="top"
      >
        <div className="border-surface-line bg-surface shadow-panel text-fg-2 inline-flex items-center gap-2 rounded-full border px-3 py-[5px] text-xs">
          <span className="bg-accent shadow-record-dot block size-1.5 rounded-full" />
          macOS - in development - iPhone first
        </div>
        <h1 className="mx-auto mt-6 max-w-[820px] text-balance text-[clamp(44px,5.6vw,72px)] font-semibold leading-[1.02] tracking-normal">
          Record your app.
          <br />
          Frame your story.
        </h1>
        <p className="text-fg-2 mx-auto mt-[22px] max-w-[600px] text-pretty text-lg leading-[1.55]">
          Plug your iPhone into your Mac, press record, and walk through your app. ReelDock captures
          the phone, your face, and your voice at once, then gives you one small editor to put them
          together.
        </p>
        <WaitlistForm
          email={email}
          inputId="waitlist-email"
          joined={joined}
          onEmailChange={setEmail}
          onSubmit={joinWaitlist}
        />
      </section>

      <section className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-14">
        <ProductWindow />
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <Panel className="p-[18px_20px_19px]" key={fact.label}>
              <div className="text-3xl font-semibold leading-none">{fact.value}</div>
              <div className="text-fg-2 mt-2 text-[13px] leading-[1.4]">{fact.label}</div>
            </Panel>
          ))}
        </div>
      </section>

      <LandingSection
        eyebrow="How it works"
        icon={Video01Icon}
        id="how"
        title="Making one demo video should not take a whole afternoon"
        body="Today it is a chain of small annoying jobs, and every one of them is a chance to get something wrong. ReelDock is four steps, and the last one is a file on your desktop."
      >
        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Panel className="p-5" key={step.title}>
              <span className="border-track-line bg-well shadow-well-soft font-ui-mono text-fg-2 inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] border px-[7px] text-[11px] font-semibold">
                {step.number}
              </span>
              <h3 className="mt-[15px] text-[16.5px] font-semibold leading-tight">{step.title}</h3>
              <p className="text-fg-2 mt-[7px] text-pretty text-[13.5px] leading-[1.55]">
                {step.text}
              </p>
            </Panel>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        eyebrow="Sources"
        icon={Plug01Icon}
        id="sources"
        title="Three recordings, kept apart on purpose"
        body="One clock, three files. Nothing is baked together while you record, so when you change your mind about the layout afterwards, you do not shoot it again."
      >
        <Panel className="p-5">
          <div className="relative grid gap-2.5">
            {sourceTracks.map((track) => (
              <div
                className="grid gap-3 md:grid-cols-[132px_1fr] md:items-center"
                key={track.label}
              >
                <div className="flex items-center gap-2.5">
                  <Icon icon={track.icon} size={18} color="currentColor" />
                  <div>
                    <div className="text-[13.5px] font-semibold">{track.label}</div>
                    <div className="font-ui-mono text-fg-3 mt-[3px] text-[11px]">{track.file}</div>
                  </div>
                </div>
                <div className="border-track-line bg-well shadow-track flex h-14 items-center gap-1 overflow-hidden rounded-[9px] border px-2.5">
                  {track.cells.map((cell, index) => (
                    <span
                      className={`${cell.className} shrink-0`}
                      key={index}
                      style={{
                        height: "height" in cell ? cell.height : undefined,
                        opacity: cell.opacity,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <span className="bg-fg absolute bottom-[-4px] left-[38%] top-[-4px] hidden w-0.5 rounded-full md:block" />
          </div>
          <div className="border-divider text-fg-2 mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-[17px] text-[13px]">
            <span>Move the camera anywhere, any time.</span>
            <span>Mute a source without touching the rest.</span>
            <span>Re-export in a different shape tomorrow.</span>
          </div>
        </Panel>
        <div className="mt-3.5 grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Panel className="p-5" key={feature.title}>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-fg-2 mt-[7px] text-pretty text-[13.5px] leading-[1.55]">
                {feature.text}
              </p>
            </Panel>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        eyebrow="Formats"
        icon={Clock03Icon}
        id="formats"
        title="One take, whatever shape you need"
        body="Record once. Export wide for your site, tall for Reels, square for the feed."
        action={
          <Segmented
            className="w-[230px]"
            onChange={setRatioId}
            options={ratioOptions}
            value={ratioId}
          />
        }
      >
        <Panel className="grid min-h-[420px] place-items-center p-7 sm:p-11">
          <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:gap-10">
            {aspectRatios.map((ratio) => (
              <RatioFrame active={ratio.id === activeRatio.id} key={ratio.id} ratio={ratio} />
            ))}
          </div>
        </Panel>
      </LandingSection>

      <section className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-[92px]">
        <div className="grid gap-3.5 lg:grid-cols-[1fr_1.15fr]">
          <Panel className="p-[26px]">
            <PanelLabel>Scope</PanelLabel>
            <h2 className="mt-3.5 text-balance text-[26px] font-semibold leading-[1.15]">
              Things it does not do, so nobody is disappointed
            </h2>
            <p className="text-fg-2 mt-3.5 text-pretty text-[14.5px] leading-[1.6]">
              ReelDock does one job. It is not trying to be your video editor, and it will not
              pretend to get around anything Apple does not allow.
            </p>
          </Panel>
          <Panel className="grid content-center gap-x-6 p-[22px_26px] sm:grid-cols-2">
            {notYet.map((item) => (
              <div className="flex items-baseline gap-2.5 py-2" key={item}>
                <span className="bg-disabled-fg relative top-[-4px] block h-[1.5px] w-2 shrink-0" />
                <span className="text-fg-2 text-[13.5px] leading-[1.45]">{item}</span>
              </div>
            ))}
          </Panel>
        </div>
        <div className="mt-3.5 grid gap-3.5 md:grid-cols-3">
          {needs.map((need) => (
            <Panel className="p-5" key={need.title}>
              <span className="border-track-line bg-well text-fg-3 inline-block rounded-full border px-[9px] py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                {need.tag}
              </span>
              <h3 className="mt-3.5 text-base font-semibold">{need.title}</h3>
              <p className="text-fg-2 mt-[7px] text-pretty text-[13.5px] leading-[1.55]">
                {need.text}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-[92px]" id="faq">
        <SectionEyebrow icon={QuestionIcon}>Questions</SectionEyebrow>
        <h2 className="mt-3 text-[clamp(30px,3.4vw,40px)] font-semibold leading-[1.08]">
          Fair questions
        </h2>
        <Panel className="mt-[26px] overflow-hidden p-0">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div className="border-divider border-b last:border-b-0" key={faq.question}>
                <button
                  className="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent p-[18px_22px] text-left"
                  onClick={() => setOpenFaq(open ? -1 : index)}
                  type="button"
                >
                  <span className="flex-1 text-[15.5px] font-semibold leading-snug">
                    {faq.question}
                  </span>
                  <span
                    className={`grid size-[26px] shrink-0 place-items-center rounded-lg border text-sm ${open ? "border-thumb-line bg-linear-to-b from-thumb-top to-thumb-bottom text-fg-2 shadow-thumb" : "border-track-line bg-well text-fg-3"}`}
                  >
                    {open ? "-" : "+"}
                  </span>
                </button>
                {open ? (
                  <div className="text-fg-2 text-pretty px-[22px] pb-5 pr-[70px] text-[14.5px] leading-[1.6]">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Panel>
      </section>

      <section className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-[92px]">
        <Panel className="p-[56px_40px_60px] text-center">
          <span className="bg-linear-to-b from-accent-top to-accent-bottom text-fg shadow-accent mx-auto grid size-16 place-items-center rounded-2xl">
            <Icon icon={AppleIcon} size={34} color="currentColor" />
          </span>
          <h2 className="mx-auto mt-5 max-w-[560px] text-balance text-[clamp(28px,3.2vw,38px)] font-semibold leading-[1.08]">
            Be there when it opens
          </h2>
          <p className="text-fg-2 mx-auto mt-3.5 max-w-[440px] text-pretty text-base leading-[1.55]">
            Leave your email and we will tell you the day you can download it. No newsletter, no
            drip campaign, nothing else.
          </p>
          <WaitlistForm
            email={email}
            joined={joined}
            onEmailChange={setEmail}
            onSubmit={joinWaitlist}
          />
        </Panel>
      </section>

      <footer className="border-titlebar-line mx-auto mt-16 flex max-w-[1160px] flex-wrap items-center gap-5 border-t px-[clamp(18px,4vw,28px)] py-[22px_56px]">
        <div className="inline-flex items-center gap-[9px]">
          <span className="bg-linear-to-b from-accent-top to-accent-bottom text-fg shadow-accent grid size-5 place-items-center rounded-[6px]">
            <Icon icon={RecordIcon} size={13} color="currentColor" />
          </span>
          <span className="text-[13.5px] font-semibold">ReelDock</span>
        </div>
        <span className="text-fg-3 text-[13px]">Record your app. Frame your story.</span>
        <span className="font-ui-mono text-fg-3 ml-auto text-[11px]">
          Made on a Mac, for Mac - 2026
        </span>
      </footer>
    </main>
  );
}

type WaitlistFormProps = {
  email: string;
  joined: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  inputId?: string;
};

function WaitlistForm({ email, inputId, joined, onEmailChange, onSubmit }: WaitlistFormProps) {
  if (joined) {
    return (
      <div className="border-surface-line bg-surface shadow-panel mt-[30px] inline-flex items-center gap-2.5 rounded-[11px] border px-[18px] py-3">
        <span className="bg-accent text-fg grid size-[19px] place-items-center rounded-full text-[11px]">
          <Icon icon={CheckmarkCircle02Icon} size={16} color="currentColor" />
        </span>
        <span className="text-sm">You are on the list. One email, the day it is ready.</span>
      </div>
    );
  }

  return (
    <form
      className="mx-auto mt-[30px] flex max-w-[430px] flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <TextField
        className="text-sm"
        containerClassName="sm:w-[262px]"
        id={inputId}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@yourstartup.com"
        type="email"
        value={email}
      />
      <Button className="min-h-[41px] whitespace-nowrap" type="submit" variant="bright">
        Join the waitlist
      </Button>
    </form>
  );
}

type LandingSectionProps = {
  eyebrow: string;
  title: string;
  body: string;
  id: string;
  icon: IconData;
  action?: React.ReactNode;
  children: React.ReactNode;
};

function LandingSection({ eyebrow, title, body, id, icon, action, children }: LandingSectionProps) {
  return (
    <section className="mx-auto max-w-[1160px] px-[clamp(18px,4vw,28px)] pt-[92px]" id={id}>
      <SectionEyebrow icon={icon}>{eyebrow}</SectionEyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-10">
        <h2 className="max-w-[560px] text-balance text-[clamp(30px,3.4vw,40px)] font-semibold leading-[1.08]">
          {title}
        </h2>
        <div className="grid gap-4">
          <p className="text-fg-2 max-w-[430px] text-pretty text-[15px] leading-[1.6]">{body}</p>
          {action ? <div className="justify-self-start sm:justify-self-end">{action}</div> : null}
        </div>
      </div>
      <div className="mt-[30px]">{children}</div>
    </section>
  );
}

function SectionEyebrow({ children, icon }: { children: React.ReactNode; icon: IconData }) {
  return (
    <div className="text-fg-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
      <Icon icon={icon} size={15} color="currentColor" />
      {children}
    </div>
  );
}

function ProductWindow() {
  return (
    <div
      className="border-surface-line bg-window shadow-window overflow-hidden rounded-2xl border"
      aria-label="ReelDock editor preview"
    >
      <div className="border-titlebar-line bg-titlebar flex h-[34px] items-center border-b px-[13px]">
        <div className="flex gap-[7px]">
          <span className="bg-traffic-close block size-[11px] rounded-full" />
          <span className="bg-traffic-minimize block size-[11px] rounded-full" />
          <span className="bg-traffic-zoom block size-[11px] rounded-full" />
        </div>
        <div className="text-fg-3 flex-1 truncate text-center text-xs">Elorah - Reading Plan</div>
        <div className="w-14" />
      </div>

      <div className="border-titlebar-line bg-track flex flex-wrap items-center gap-[11px] border-b px-3.5 py-[11px]">
        <Button size="sm" variant="dark">
          Projects
        </Button>
        <div className="text-[13px] font-semibold">Elorah - Reading Plan</div>
        <div className="text-fg-3 text-[11.5px]">Saved</div>
        <div className="hidden flex-1 md:block" />
        <Segmented className="w-[168px]" options={ratioOptions} value="16:9" />
        <Button size="md" variant="bright">
          Export
        </Button>
      </div>

      <div className="grid min-h-[428px] lg:grid-cols-[1fr_228px]">
        <div className="bg-titlebar-line grid place-items-center p-[26px]">
          <div className="bg-bright-bottom shadow-stage relative flex aspect-video w-full max-w-[660px] items-center justify-center rounded-[4px]">
            <PhoneMockup />
            <div className="border-bright-hover-top bg-camera-hatch shadow-bubble absolute bottom-[12%] right-[7%] grid aspect-square w-[20%] place-items-center rounded-full border-2">
              <span className="font-ui-mono text-placeholder-fg text-[8px] uppercase tracking-[0.08em]">
                Camera
              </span>
            </div>
          </div>
        </div>

        <aside className="border-titlebar-line bg-track border-l p-[17px_16px]">
          <PanelLabel>Layout</PanelLabel>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <LayoutTile />
            <LayoutTile selected />
            <LayoutTile />
            <LayoutTile />
          </div>
          <div className="bg-divider my-[17px] h-px" />
          <PanelSlider label="Phone size" value="62%" />
          <PanelSlider className="mt-[18px]" label="Background" swatches value="Bone" />
        </aside>
      </div>

      <div className="border-titlebar-line bg-track flex h-[74px] items-center gap-3.5 border-t px-4">
        <TransportButton aria-label="Play preview">
          <Icon icon={PlayIcon} size={16} color="currentColor" />
        </TransportButton>
        <Timecode className="shrink-0">
          00:18 <span className="text-fg-3">/ 01:04</span>
        </Timecode>
        <div className="border-track-line bg-well shadow-track relative flex h-[38px] flex-1 items-center gap-0.5 overflow-hidden rounded-lg border px-[5px]">
          {timelineBars.map((bar, index) => (
            <span
              className={`${bar.className} flex-1 rounded-[1px]`}
              key={index}
              style={{ height: bar.height }}
            />
          ))}
          <span className="bg-fg shadow-hairline absolute bottom-0 left-[27%] top-0 w-0.5" />
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="bg-on-bright shadow-device relative aspect-[9/19.5] h-[84%] rounded-[18px] p-[3px]">
      <div className="bg-screen relative flex size-full flex-col overflow-hidden rounded-[15px]">
        <div className="bg-on-bright absolute left-1/2 top-1 z-10 h-[9px] w-[34%] -translate-x-1/2 rounded-md" />
        <div className="px-3 pb-0 pt-4">
          <div className="text-screen-ink-2 text-[5px] font-bold uppercase tracking-[0.12em]">
            Day 12 of 30
          </div>
          <div className="text-screen-ink mt-1 text-[12.5px] font-semibold leading-[1.14]">
            Wisdom for
            <br />
            the morning
          </div>
          <div className="bg-screen-track mt-2.5 h-[3px] overflow-hidden rounded-sm">
            <span className="bg-screen-ink block h-full w-[40%]" />
          </div>
          <div className="text-screen-ink-2 mt-1 text-[4.5px]">12 of 30 days complete</div>
        </div>
        <div className="flex flex-col gap-[5px] px-2.5 pt-3">
          {phoneRows.map((row) => (
            <div
              className="border-screen-line bg-screen-accent-soft flex items-center gap-1.5 rounded-md border px-[7px] py-1.5"
              key={row.title}
            >
              <span className="bg-screen-track text-screen-ink-2 grid size-[11px] place-items-center rounded-[3px] text-[5px] font-bold">
                {row.number}
              </span>
              <span className="flex-1">
                <span className="text-screen-ink block text-[5.5px] font-semibold">
                  {row.title}
                </span>
                <span className="text-screen-ink-2 block text-[4.5px]">{row.sub}</span>
              </span>
              <span className="border-screen-control block size-2 rounded-full border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayoutTile({ selected = false }: { selected?: boolean }) {
  return (
    <span
      className={`block h-[46px] rounded-[9px] border ${selected ? "border-accent bg-linear-to-b from-thumb-top to-thumb-bottom shadow-control-lift" : "border-track-line bg-well"}`}
    />
  );
}

function PanelSlider({
  className,
  label,
  swatches = false,
  value,
}: {
  className?: string;
  label: string;
  swatches?: boolean;
  value: string;
}) {
  return (
    <div className={className}>
      <div className="text-fg-2 flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-ui-mono text-fg text-[11px]">{value}</span>
      </div>
      {swatches ? (
        <div className="mt-2.5 flex gap-2">
          <span className="bg-bright-bottom shadow-swatch size-[26px] rounded-full" />
          <span className="border-control-line bg-on-bright size-[26px] rounded-full border" />
          <span className="border-control-line bg-promo-lens-rim size-[26px] rounded-full border" />
          <span className="border-control-line bg-control-top size-[26px] rounded-full border" />
        </div>
      ) : (
        <div className="border-track-line bg-well shadow-track relative mt-2.5 h-1.5 rounded-[3px] border">
          <span className="bg-linear-to-b from-accent-top to-accent-bottom absolute bottom-0 left-0 top-0 w-[62%] rounded-[3px]" />
          <span className="border-bright-line bg-linear-to-b from-bright-top to-bright-bottom shadow-knob-sm absolute left-[62%] top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border" />
        </div>
      )}
    </div>
  );
}

type Ratio = (typeof aspectRatios)[number];

function RatioFrame({ active, ratio }: { active: boolean; ratio: Ratio }) {
  const height = active ? ratio.height : ratio.height * 0.74;
  const width = height * ratio.aspect;
  const tall = ratio.aspect < 1;
  const style = {
    "--ratio-frame-height": `${height}px`,
    "--ratio-frame-width": `${width}px`,
  } as CSSProperties;

  return (
    <div
      className={`transition-opacity duration-300 ${active ? "opacity-100" : "opacity-40"}`}
      style={style}
    >
      <div className="ease-glide bg-bright-bottom shadow-stage relative flex h-[calc(var(--ratio-frame-height)*0.62)] w-[calc(var(--ratio-frame-width)*0.62)] items-center justify-center rounded-[5px] transition-[height,width] duration-300 sm:h-[var(--ratio-frame-height)] sm:w-[var(--ratio-frame-width)]">
        <div
          className={`bg-on-bright relative aspect-[9/19.5] rounded-[9px] transition-[height,transform] duration-300 ${tall ? "h-[62%] -translate-y-[13%]" : "h-[80%]"}`}
        >
          <span className="bg-control-top absolute left-1/2 top-[5%] h-[4.5%] w-[34%] -translate-x-1/2 rounded-full" />
        </div>
        <div
          className={`border-bright-hover-top bg-camera-hatch absolute aspect-square rounded-full border-2 transition-all duration-300 ${tall ? "bottom-[8%] right-1/2 w-[26%] translate-x-1/2" : "bottom-[10%] right-[8%] w-[22%]"}`}
        />
      </div>
      <div className="mt-3.5 text-center">
        <div className="text-[13.5px] font-semibold">{ratio.id}</div>
        <div className="text-fg-3 mt-[3px] text-xs">{ratio.use}</div>
      </div>
    </div>
  );
}
