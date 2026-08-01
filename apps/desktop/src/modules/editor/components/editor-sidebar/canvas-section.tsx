import {
  BACKGROUND_KINDS,
  CANVAS_FITS,
  CANVAS_PADDING_MAX,
  CANVAS_PADDING_MIN,
  RATIO_RESOLUTIONS,
  type BackgroundKind,
  type CanvasFit,
  type CanvasRatio,
} from "@reeldock/shared";
import {
  Divider,
  DropZone,
  SettingsList,
  SettingsRow,
  Slider,
  Stepper,
  Swatch,
  cn,
} from "@reeldock/ui";
import { GRADIENTS, PATTERNS } from "@/modules/project";
import { SOLID_BACKGROUNDS } from "../../data/editor-data";
import { FieldSegmented } from "../field-segmented";
import type { EditorSidebarSectionProps } from "./types";

export function CanvasSection({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="grid gap-4">
      <CanvasRatioPicker value={doc.ratio} onChange={(ratio) => onUpdate({ ratio })} />
      {doc.ratio === "custom" ? (
        <SettingsList>
          <SettingsRow label="Width">
            <Stepper
              max={3840}
              min={320}
              onChange={(cw) => onUpdate({ cw })}
              step={80}
              value={doc.cw}
            />
          </SettingsRow>
          <SettingsRow label="Height">
            <Stepper
              max={3840}
              min={320}
              onChange={(chh) => onUpdate({ chh })}
              step={80}
              value={doc.chh}
            />
          </SettingsRow>
        </SettingsList>
      ) : (
        <div className="flex justify-between text-[12.5px]">
          <span className="text-fg-2">Exports at</span>
          <span className="font-ui-mono text-fg-value">{RATIO_RESOLUTIONS[doc.ratio]}</span>
        </div>
      )}
      <Divider />
      <FieldSegmented<BackgroundKind>
        label="Background"
        onChange={(bgKind) => onUpdate({ bgKind })}
        options={BACKGROUND_KINDS.map((kind) => kind.id)}
        value={doc.bgKind}
      />
      {doc.bgKind === "solid" ? <SolidBackgroundPicker doc={doc} onUpdate={onUpdate} /> : null}
      {doc.bgKind === "gradient" ? (
        <GradientBackgroundPicker doc={doc} onUpdate={onUpdate} />
      ) : null}
      {doc.bgKind === "pattern" ? <PatternBackgroundPicker doc={doc} onUpdate={onUpdate} /> : null}
      {doc.bgKind === "image" ? (
        <>
          <DropZone hint="png · jpg · heic">Drop an image</DropZone>
          <FieldSegmented<CanvasFit>
            label="Fit"
            onChange={(fit) => onUpdate({ fit })}
            options={CANVAS_FITS.map((fit) => fit.id)}
            value={doc.fit}
          />
        </>
      ) : null}
      <Slider
        label="Outer padding"
        max={CANVAS_PADDING_MAX}
        min={CANVAS_PADDING_MIN}
        onChange={(pad) => onUpdate({ pad }, true)}
        value={doc.pad}
      />
    </div>
  );
}

const RATIO_PREVIEWS: Record<CanvasRatio, { label: string; w: number; h: number }> = {
  "16:9": { label: "16:9", w: 78, h: 44 },
  "9:16": { label: "9:16", w: 36, h: 64 },
  "1:1": { label: "1:1", w: 58, h: 58 },
  custom: { label: "Custom", w: 68, h: 50 },
};

const RATIO_PICKER_OPTIONS = [
  "16:9",
  "1:1",
  "9:16",
  "custom",
] as const satisfies readonly CanvasRatio[];

function CanvasRatioPicker({
  value,
  onChange,
}: {
  value: CanvasRatio;
  onChange: (ratio: CanvasRatio) => void;
}) {
  return (
    <div>
      <div className="text-fg-2 mb-3 text-[12.5px]">Aspect ratio</div>
      <div className="grid grid-cols-3 gap-x-5 gap-y-4">
        {RATIO_PICKER_OPTIONS.map((ratio) => {
          const preview = RATIO_PREVIEWS[ratio];
          const selected = value === ratio;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "rd-press group flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium",
                selected ? "text-fg" : "text-fg-3 hover:text-fg-control"
              )}
              key={ratio}
              onClick={() => onChange(ratio)}
              type="button"
            >
              <span className="flex h-16 w-full items-center justify-center">
                <span
                  className={cn(
                    "border-raised-line bg-control-bottom shadow-row block rounded-[8px] border transition-colors",
                    selected && "border-fg-control shadow-selected"
                  )}
                  style={{ width: preview.w, height: preview.h }}
                />
              </span>
              <span>{preview.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SolidBackgroundPicker({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOLID_BACKGROUNDS.map((swatch) => (
        <Swatch
          color={swatch.value}
          key={swatch.label}
          label={swatch.label}
          onSelect={() => onUpdate({ bg: swatch.value, bgKind: "solid" })}
          selected={doc.bg === swatch.value}
        />
      ))}
    </div>
  );
}

function GradientBackgroundPicker({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {GRADIENTS.map((gradient, index) => (
        <Swatch
          className="h-[46px] w-full"
          color={gradient}
          key={gradient}
          onSelect={() => onUpdate({ grad: index, bgKind: "gradient" })}
          selected={doc.grad === index}
        />
      ))}
    </div>
  );
}

function PatternBackgroundPicker({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PATTERNS.map((pattern, index) => (
        <button
          className={cn(
            "rd-press border-swatch-line h-[46px] rounded-[8px] border",
            doc.pat === index && "shadow-swatch"
          )}
          key={pattern.label}
          onClick={() => onUpdate({ pat: index, bgKind: "pattern" })}
          style={{ background: pattern.css }}
          type="button"
        />
      ))}
    </div>
  );
}
