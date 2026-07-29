import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Menu,
  MenuItem,
  Modal,
  Popover,
  PopoverInfo,
  PopoverTip,
  ProgressBar,
  SettingsList,
  SettingsRow,
  type PopoverSide,
} from "@reeldock/ui";
import { PageHeader } from "@/components/page-header";
import { Specimen } from "@/components/kit";

export const Route = createFileRoute("/overlays")({ component: OverlaysPage });

const TRIGGERS: { label: string; side: PopoverSide; hint: string }[] = [
  { label: "Top", side: "top", hint: "flips down near the top edge" },
  { label: "Right", side: "right", hint: "flips left near the right edge" },
  { label: "Menu", side: "bottom", hint: "bottom, shifts to stay in view" },
  { label: "Left", side: "left", hint: "flips right near the left edge" },
  { label: "Detail", side: "bottom", hint: "wide card, arrow tracks anchor" },
];

function OverlaysPage() {
  return (
    <>
      <PageHeader
        eyebrow="ReelDock · UI primitives"
        title="Overlays"
        description="Each trigger asks for a side. If it doesn't fit, the popover flips to the opposite side; if it still hangs off, it shifts along the other axis and the arrow slides to keep pointing at its anchor. Scroll the page or narrow the window with one open — it re-solves live. Click outside or press Escape to dismiss."
      />

      <div className="mt-7 grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Specimen
          id="popovers"
          label="Popover"
          note={
            <>
              flip → shift → arrow clamp, 12px viewport padding, 11px anchor gap
              <br />
              arrow is a rotated square with two outward borders, so the seam matches
            </>
          }
          wide
        >
          <div className="border-well-line bg-well shadow-well flex flex-wrap items-center justify-between gap-3 rounded-[12px] border p-[22px]">
            {TRIGGERS.map((trigger) => (
              <div className="flex flex-col items-start gap-2" key={trigger.label}>
                <Popover content={popoverContent(trigger.label)} side={trigger.side}>
                  <Button>{trigger.label}</Button>
                </Popover>
                <span className="text-fg-faint max-w-[150px] text-[11px] leading-[1.4]">
                  {trigger.hint}
                </span>
              </div>
            ))}
          </div>
        </Specimen>

        <Specimen
          id="menu"
          label="Menu"
          note="hover fills at 6% white · danger items shift hue, not weight"
        >
          <Menu className="border-popover-line bg-linear-to-b from-popover-top to-popover-bottom shadow-popover rounded-[12px] border">
            <MenuItem shortcut="⌘D">Duplicate layout</MenuItem>
            <MenuItem shortcut="⇧⌘S">Save as preset</MenuItem>
            <MenuItem>Reset to default</MenuItem>
            <MenuItem danger shortcut="⌫">
              Delete preset
            </MenuItem>
          </Menu>
        </Specimen>

        <Specimen id="modal" label="Dialog" note="720px sheet on a 60% scrim, 40px lift">
          <ModalDemo />
        </Specimen>
      </div>
    </>
  );
}

function popoverContent(label: string) {
  if (label === "Menu") {
    return (
      <Menu>
        <MenuItem shortcut="⌘D">Duplicate layout</MenuItem>
        <MenuItem shortcut="⇧⌘S">Save as preset</MenuItem>
        <MenuItem>Reset to default</MenuItem>
        <MenuItem danger shortcut="⌫">
          Delete preset
        </MenuItem>
      </Menu>
    );
  }

  if (label === "Detail") {
    return (
      <PopoverInfo
        actions={
          <>
            <Button size="sm" variant="bright">
              Got it
            </Button>
            <Button size="sm" variant="ghost">
              Learn more
            </Button>
          </>
        }
        title="Phone audio"
      >
        Captured only when the connected iPhone routes audio over the cable. If it's silent, narrate
        with the microphone instead.
      </PopoverInfo>
    );
  }

  return (
    <PopoverTip>
      Each source is written to its own file, so layout stays editable after recording.
    </PopoverTip>
  );
}

function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-well-line bg-well shadow-well relative h-[300px] overflow-hidden rounded-[10px] border">
      <div className="flex h-full items-center justify-center">
        <Button onClick={() => setOpen(true)} variant="bright">
          Export…
        </Button>
      </div>
      <Modal
        actions={
          <>
            <Button onClick={() => setOpen(false)} variant="bright">
              Start export
            </Button>
            <Button onClick={() => setOpen(false)} variant="ghost">
              Cancel
            </Button>
          </>
        }
        className="w-[520px]"
        onDismiss={() => setOpen(false)}
        open={open}
        subtitle="1920 × 1080 · H.264 · 30 fps"
        title="Export recording"
      >
        <div className="px-7 pt-5">
          <SettingsList>
            <SettingsRow label="Destination">
              <span className="font-ui-mono text-fg-value text-[12px]">~/Movies/ReelDock</span>
            </SettingsRow>
            <SettingsRow label="Estimated size">
              <span className="font-ui-mono text-fg-value text-[12px]">412 MB</span>
            </SettingsRow>
          </SettingsList>
          <div className="mt-[22px]">
            <ProgressBar value={0} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
