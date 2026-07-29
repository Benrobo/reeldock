import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@benrobo/iconary/react";
import {
  CameraVideoIcon,
  Image01Icon,
  Mic01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  Banner,
  Button,
  Checklist,
  CodeBlock,
  Divider,
  DropZone,
  EmptyState,
  GroupLabel,
  RecordingPill,
  SettingsList,
  SettingsRow,
  SurfaceRow,
  Switch,
  Timecode,
  ValueChip,
  Well,
  WindowChrome,
} from "@reeldock/ui";
import { PageHeader } from "@/components/page-header";
import { Specimen, Stack } from "@/components/kit";

export const Route = createFileRoute("/surfaces")({ component: SurfacesPage });

function SurfacesPage() {
  return (
    <>
      <PageHeader
        eyebrow="ReelDock · UI primitives"
        title="Surfaces"
        description="Panels hold everything at #24221f. Rows gradient down one step from the panel; banners tint the whole row rather than adding a left accent bar; wells invert the recipe entirely for read-only detail."
      />

      <div className="mt-7 grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
        <Specimen
          id="rows"
          label="Rows & banners"
          note={
            <>
              panel #24221f · row gradient #2f2c28→#282521
              <br />
              banners tint the whole row, no left accent bar
            </>
          }
        >
          <Stack>
            <SurfaceRow tone="ok">
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold">Phone</div>
                <div className="text-fg-3 mt-px text-[11.5px]">iPhone 15 Pro · USB</div>
              </div>
              <Icon color="currentColor" icon={SmartPhone01Icon} size={18} />
            </SurfaceRow>
            <Banner action={<Button size="mini">Look again</Button>} tone="warn">
              No iPhone found.
            </Banner>
            <Well>Recessed well — for read-only detail and checklists.</Well>
          </Stack>
        </Specimen>

        <Specimen
          id="settings"
          label="Settings groups"
          note="hairlines are a 1px flex gap over the group's own background"
        >
          <GroupLabel>Recording</GroupLabel>
          <SettingsList className="mt-2.5">
            <SettingsRow hint="Record your face alongside the phone" label="Camera">
              <Switch defaultChecked label="Camera" />
            </SettingsRow>
            <SettingsRow hint="Encode with VideoToolbox" label="Hardware acceleration">
              <Switch defaultChecked label="Hardware acceleration" />
            </SettingsRow>
            <SettingsRow hint="Where finished exports are written" label="Destination">
              <ValueChip>Movies</ValueChip>
            </SettingsRow>
          </SettingsList>
        </Specimen>

        <Specimen
          id="checklist"
          label="Checklists & notes"
          note="bullets sit at 5px, muted to #5c5852"
        >
          <Checklist
            items={[
              "Unlock the iPhone and keep it awake.",
              "Trust this Mac when the prompt appears.",
              "Use the cable that shipped with the device.",
            ]}
            title="Before you record"
          />
          <Divider />
          <CodeBlock>{`reeldock capture --source iphone \\
  --audio microphone \\
  --out ~/Movies/ReelDock`}</CodeBlock>
        </Specimen>

        <Specimen
          id="empty"
          label="Empty & drop targets"
          note="dashed borders only, never dashed fills"
        >
          <EmptyState className="h-[220px] w-full" title="No recording yet">
            Connect an iPhone and press Record to fill this canvas.
          </EmptyState>
          <div className="mt-3.5">
            <DropZone hint="mov · mp4 · m4a">Drop media to add a source</DropZone>
          </div>
        </Specimen>

        <Specimen
          id="window"
          label="Window chrome"
          note="38px titlebar, centered title, traffic lights at 12px"
          wide
        >
          <WindowChrome title="ReelDock — Untitled" trailing={<Timecode>00:04:12</Timecode>}>
            <div className="border-titlebar-line bg-canvas flex items-center gap-3 border-b px-6 py-3.5">
              <RecordingPill />
              <div className="text-fg-3 ml-auto flex items-center gap-2.5">
                <Icon color="currentColor" icon={SmartPhone01Icon} size={18} />
                <Icon color="currentColor" icon={CameraVideoIcon} size={18} />
                <Icon color="currentColor" icon={Mic01Icon} size={18} />
              </div>
            </div>
            <div className="bg-canvas flex h-[220px] items-center justify-center">
              <EmptyState
                className="h-[164px] w-[340px]"
                glyph={<Icon color="currentColor" icon={Image01Icon} size={34} />}
                title="Canvas preview"
              />
            </div>
          </WindowChrome>
        </Specimen>
      </div>
    </>
  );
}
