import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@benrobo/iconary/react";
import {
  CameraVideoIcon,
  Mic01Icon,
  SmartPhone01Icon,
  VolumeHighIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import type { IconData } from "@benrobo/iconary/core";
import {
  Badge,
  Button,
  ChoiceCard,
  FieldRow,
  HelpBadge,
  LinkButton,
  PathField,
  PopupSelect,
  RecordingPill,
  SelectButton,
  SourceChip,
  StatusPill,
  Swatch,
  Switch,
  Tag,
  TextField,
  cn,
  type Rect,
} from "@reeldock/ui";
import { CANVAS_BACKGROUNDS } from "@reeldock/shared";
import { PageHeader } from "@/components/page-header";
import { Specimen, Stack, Wrap } from "@/components/kit";

export const Route = createFileRoute("/selection")({ component: SelectionPage });

const LAYOUTS: { label: string; phone: Rect; camera: Rect }[] = [
  {
    label: "Picture in picture",
    phone: { x: 38, y: 5, w: 23, h: 90 },
    camera: { x: 68, y: 58, w: 19, h: 34, radius: 11 },
  },
  {
    label: "Side by side",
    phone: { x: 7, y: 10, w: 21, h: 80 },
    camera: { x: 40, y: 24, w: 52, h: 52, radius: 3 },
  },
];

function SelectionPage() {
  return (
    <>
      <PageHeader
        eyebrow="ReelDock · UI primitives"
        title="Selection & status"
        description="Status tints sit at 14–16% with the border at the same hue and 36–42%, and the dot always stays full strength. Selection reads as an accent border plus an 18%→7% gradient wash — except swatches, which use a double ring so the fill is never obscured."
      />

      <div className="mt-7 grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Specimen
          id="pills"
          label="Pills & status"
          note={
            <>
              tint at 14–16% · border same hue at 36–42%
              <br />
              dot always the full-strength hue · radius 8
            </>
          }
        >
          <Wrap>
            <RecordingPill />
            <StatusPill tone="ok">Ready</StatusPill>
            <StatusPill tone="warn">Low disk</StatusPill>
            <StatusPill tone="neutral">Camera off</StatusPill>
            <Tag>USB</Tag>
            <Badge>Beta</Badge>
            <HelpBadge />
          </Wrap>
          <div className="mt-3.5">
            <Wrap>
              <SourceChip tone="rec">
                <span className="text-[12px] font-medium">Phone</span>
              </SourceChip>
              <SourceChip tone="ok">
                <span className="text-[12px] font-medium">Microphone</span>
              </SourceChip>
              <SourceChip>
                <span className="text-fg-2 text-[12px] font-medium">Camera</span>
              </SourceChip>
            </Wrap>
          </div>
        </Specimen>

        <Specimen
          id="cards"
          label="Selection cards"
          note={
            <>
              selected = accent border + 18%→7% gradient wash
              <br />
              swatch selection is a double ring, never a border swap
            </>
          }
        >
          <SelectionDemo />
        </Specimen>

        <Specimen
          id="fields"
          label="Fields"
          note={
            <>
              wells invert the recipe: #1b1917 + inset shadow
              <br />
              focus adds a 3px ring at 22% accent
            </>
          }
          wide
        >
          <Stack>
            <FieldRow label="Camera">
              <SelectButton>FaceTime HD Camera</SelectButton>
            </FieldRow>
            <PathField action={<Button size="mini">Choose</Button>} value="~/Movies/ReelDock" />
            <LinkButton>Open project folder</LinkButton>
            <TextField
              defaultValue="elorah-reading-plan"
              placeholder="Project name"
              trailing="focused"
            />
          </Stack>
        </Specimen>

        <Specimen
          id="popup-select"
          label="Popup select"
          note={
            <>
              one fixed row can own many devices
              <br />
              the menu overlays the panel, so rows below do not jump
            </>
          }
        >
          <PopupSelectDemo />
        </Specimen>
      </div>
    </>
  );
}

const CAMERA_OPTIONS = [
  { value: "camo", label: "Camo Camera", meta: "Virtual · iPhone as webcam" },
  { value: "macbook", label: "MacBook Pro Camera", meta: "Built in · 1920 x 1080" },
  { value: "opal", label: "Opal C1", meta: "USB-C · external" },
];

const MIC_OPTIONS = [
  {
    value: "shure",
    label: "Shure MV7",
    meta: "USB · 48 kHz",
    trailing: <PreviewMiniMeter value={64} />,
  },
  {
    value: "macbook",
    label: "MacBook Pro Microphone",
    meta: "Built in · 3 element array",
    trailing: <PreviewMiniMeter value={38} />,
  },
  {
    value: "camo",
    label: "Camo Microphone",
    meta: "Virtual · follows the phone",
    trailing: <PreviewMiniMeter value={18} />,
  },
];

function PopupSelectDemo() {
  const [camera, setCamera] = useState("macbook");
  const [mic, setMic] = useState("shure");

  return (
    <div className="border-surface-line bg-surface shadow-panel w-full max-w-[430px] rounded-[12px] border">
      <PreviewSourceRow
        action={
          <span className="font-ui-mono text-fg-key w-11 shrink-0 text-center text-[10.5px]">
            always
          </span>
        }
        active
        icon={SmartPhone01Icon}
        label="Phone"
        toneClassName="text-accent"
      >
        <div className="border-well-line bg-well shadow-well flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg border px-3">
          <span className="bg-ok block size-1.5 shrink-0 rounded-full" />
          <span className="text-fg min-w-0 flex-1 truncate text-[12.5px] font-semibold">
            Benaiah
          </span>
          <span className="font-ui-mono text-fg-3 shrink-0 text-[10.5px]">USB</span>
        </div>
      </PreviewSourceRow>
      <PreviewSourceRow
        action={<Switch checked label="Camera" />}
        active
        icon={CameraVideoIcon}
        label="Camera"
        toneClassName="text-warn"
      >
        <PopupSelect
          ariaLabel="Camera source"
          className="min-w-0 flex-1"
          onChange={setCamera}
          options={CAMERA_OPTIONS}
          value={camera}
        />
      </PreviewSourceRow>
      <PreviewSourceRow
        action={<Switch checked label="Mic" />}
        active
        icon={Mic01Icon}
        label="Mic"
        toneClassName="text-[#c084fc]"
      >
        <PopupSelect
          ariaLabel="Microphone source"
          className="min-w-0 flex-1"
          onChange={setMic}
          options={MIC_OPTIONS}
          value={mic}
        />
      </PreviewSourceRow>
      <PreviewSourceRow
        action={<Switch checked={false} disabled label="Phone sound" />}
        active
        icon={VolumeHighIcon}
        label="Sound"
        toneClassName="text-accent"
      >
        <div className="border-disabled-line bg-track text-fg-faint flex h-[34px] min-w-0 flex-1 items-center rounded-lg border px-3 text-[12.5px]">
          <span className="truncate">Detected, recorder not wired yet</span>
        </div>
      </PreviewSourceRow>
    </div>
  );
}

type PreviewSourceRowProps = {
  icon: IconData;
  label: string;
  active: boolean;
  toneClassName: string;
  children: ReactNode;
  action: ReactNode;
};

function PreviewSourceRow({
  icon,
  label,
  active,
  toneClassName,
  children,
  action,
}: PreviewSourceRowProps) {
  return (
    <div className="border-divider relative flex items-center gap-2.5 border-b px-3 py-[11px] last:border-b-0">
      <div
        className={cn(
          "flex w-[84px] shrink-0 items-center gap-2",
          active ? "text-fg" : "text-fg-faint"
        )}
      >
        <Icon
          className={cn("shrink-0", active ? toneClassName : "text-fg-faint")}
          color="currentColor"
          icon={icon}
          size={14}
        />
        <span className="truncate text-[12.5px] font-semibold">{label}</span>
      </div>
      {children}
      {action}
    </div>
  );
}

function PreviewMiniMeter({ value }: { value: number }) {
  return (
    <span className="border-track-line bg-well block h-[7px] w-8 shrink-0 overflow-hidden rounded-full border">
      <span
        className="from-ok to-ok-meter-end block h-full rounded-full bg-linear-to-r"
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

function SelectionDemo() {
  const [layout, setLayout] = useState(0);
  const [swatch, setSwatch] = useState(0);

  return (
    <>
      <div className="grid grid-cols-2 gap-[9px]">
        {LAYOUTS.map((item, index) => (
          <ChoiceCard
            camera={item.camera}
            key={item.label}
            label={item.label}
            onSelect={() => setLayout(index)}
            phone={item.phone}
            selected={layout === index}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-[9px]">
        {CANVAS_BACKGROUNDS.map((background, index) => (
          <Swatch
            color={background.value}
            key={background.id}
            label={background.label}
            onSelect={() => setSwatch(index)}
            selected={swatch === index}
          />
        ))}
      </div>
    </>
  );
}
