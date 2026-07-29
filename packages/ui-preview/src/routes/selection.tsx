import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  ChoiceCard,
  FieldRow,
  HelpBadge,
  PathField,
  RecordingPill,
  SelectButton,
  SourceChip,
  StatusPill,
  Swatch,
  Tag,
  TextField,
  type Rect,
} from "@reeldock/ui";
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

const SWATCHES = ["#F4F2EC", "#E8E2D6", "#1C1B19", "#2F4C46", "#C4D4E0"];

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
            <TextField
              defaultValue="elorah-reading-plan"
              placeholder="Project name"
              trailing="focused"
            />
          </Stack>
        </Specimen>
      </div>
    </>
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
        {SWATCHES.map((color, index) => (
          <Swatch
            color={color}
            key={color}
            onSelect={() => setSwatch(index)}
            selected={swatch === index}
          />
        ))}
      </div>
    </>
  );
}
