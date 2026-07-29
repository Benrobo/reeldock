import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@benrobo/iconary/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Download01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  Button,
  IconButton,
  Meter,
  ProgressBar,
  RecordDot,
  Segmented,
  Slider,
  SplitButton,
  Stepper,
  SwitchRow,
  Tabs,
  ToolButton,
  TransportButton,
} from "@reeldock/ui";
import { PageHeader } from "@/components/page-header";
import { Specimen, Stack, Wrap } from "@/components/kit";

export const Route = createFileRoute("/")({ component: ControlsPage });

function ControlsPage() {
  return (
    <>
      <PageHeader
        eyebrow="ReelDock · UI primitives"
        title="Controls"
        description="One recipe underneath everything: a 1px border, a top-to-bottom gradient of about 8% lightness, a hairline highlight along the top edge, and a 1–2px drop shadow. Raised things gradient down and cast a shadow; recessed things — tracks, wells, fields — invert both. Everything here is live: press it."
      />

      <div className="mt-7 grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Specimen
          id="buttons"
          label="Buttons"
          note={
            <>
              press: scale(.975) + brightness(.96) + inset shadow, 90ms in / 200ms out
              <br />
              the surface darkens as it sinks — light travels down with it
            </>
          }
        >
          <Wrap>
            <Button variant="bright">Export</Button>
            <Button variant="dark">Look again</Button>
            <Button variant="accent">Allow</Button>
            <Button leading={<RecordDot />} variant="record">
              Record
            </Button>
            <Button variant="ghost">Cancel</Button>
            <Button disabled>Record</Button>
          </Wrap>
          <div className="mt-3.5">
            <Wrap>
              <Button size="sm">Small</Button>
              <Button size="mini">Mini</Button>
              <SplitButton>New recording</SplitButton>
              <div className="flex gap-1.5">
                <IconButton aria-label="Previous">
                  <Icon color="currentColor" icon={ArrowLeft01Icon} size={14} />
                </IconButton>
                <IconButton aria-label="Next">
                  <Icon color="currentColor" icon={ArrowRight01Icon} size={14} />
                </IconButton>
              </div>
            </Wrap>
          </div>
          <div className="mt-3.5">
            <Wrap>
              <Button
                leading={<Icon color="currentColor" icon={Download01Icon} size={16} />}
                variant="bright"
              >
                Save
              </Button>
              <Button
                leading={<Icon color="currentColor" icon={RefreshIcon} size={16} />}
                variant="dark"
              >
                Look again
              </Button>
              <IconButton aria-label="More" pressed>
                <Icon color="currentColor" icon={MoreHorizontalIcon} size={15} />
              </IconButton>
            </Wrap>
          </div>
        </Specimen>

        <Specimen
          id="segmented"
          label="Segmented"
          note={
            <>
              the thumb slides — left transitions over 260ms
              <br />
              equal-width segments, so the thumb is pure calc()
            </>
          }
        >
          <Stack>
            <Segmented className="w-[260px]" options={["16:9", "9:16", "1:1"]} size="sm" />
            <Segmented defaultValue="Rounded" options={["Circle", "Rounded"]} />
            <Tabs options={["General", "Devices", "Recording", "Export"]} />
          </Stack>
        </Specimen>

        <Specimen
          id="switches"
          label="Switches"
          note={
            <>
              44×26 track, recessed · 20px raised knob
              <br />
              knob moves on transform, track cross-fades, both 240ms
            </>
          }
        >
          <SwitchDemo />
        </Specimen>

        <Specimen
          id="sliders"
          label="Sliders"
          note="track recessed, fill and knob raised · drag anywhere on the row"
        >
          <Slider defaultValue={88} label="Microphone" tone="ok" />
          <div className="mt-5">
            <Slider defaultValue={34} label="Corner radius" tone="accent" />
          </div>
          <div className="mt-[22px]">
            <div className="text-fg-label mb-[9px] text-[11px] font-semibold uppercase tracking-[0.1em]">
              Input meter
            </div>
            <Meter />
          </div>
          <div className="mt-[22px]">
            <div className="text-fg-label mb-[9px] text-[11px] font-semibold uppercase tracking-[0.1em]">
              Export progress
            </div>
            <ProgressBar value={64} />
          </div>
        </Specimen>

        <Specimen
          id="transport"
          label="Transport & toolbar"
          note="disabled tool buttons drop the gradient and the shadow entirely"
        >
          <TransportDemo />
        </Specimen>

        <Specimen
          id="stepper"
          label="Stepper"
          note="value well is recessed between two raised keys"
        >
          <Stack>
            <Stepper defaultValue={34} format={(v) => `${v} px`} max={64} min={0} />
            <Stepper defaultValue={30} format={(v) => `${v} fps`} max={60} min={24} step={6} />
          </Stack>
        </Specimen>
      </div>
    </>
  );
}

const SWITCHES = [
  { label: "Camera", hint: "Record your face alongside the phone", initial: true },
  { label: "Phone frame", hint: "Draw the device bezel", initial: false },
  { label: "Hardware acceleration", hint: "Encode with VideoToolbox", initial: true },
];

function SwitchDemo() {
  const [state, setState] = useState(SWITCHES.map((s) => s.initial));

  return (
    <div className="flex flex-col gap-3.5">
      {SWITCHES.map((item, index) => (
        <SwitchRow
          checked={state[index]}
          hint={item.hint}
          key={item.label}
          label={item.label}
          onChange={(next) =>
            setState((current) => current.map((v, i) => (i === index ? next : v)))
          }
        />
      ))}
    </div>
  );
}

function TransportDemo() {
  const [playing, setPlaying] = useState(false);

  return (
    <Wrap>
      <TransportButton aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)}>
        <Icon color="currentColor" icon={playing ? PauseIcon : PlayIcon} size={14} />
      </TransportButton>
      <ToolButton>Split</ToolButton>
      <ToolButton>Trim</ToolButton>
      <ToolButton disabled>Undo</ToolButton>
    </Wrap>
  );
}
