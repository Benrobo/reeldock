import {
  CAMERA_ROUNDNESS_DEFAULT,
  CAMERA_SIZE_DEFAULT,
  CAMERA_SIZE_MAX,
  CAMERA_SIZE_MIN,
  CAMERA_SHAPES,
  type CameraShape,
} from "@reeldock/shared";
import { Button, Slider, SwitchRow, cn } from "@reeldock/ui";
import type { EditorSidebarSectionProps } from "./types";

type CameraSectionProps = EditorSidebarSectionProps & {
  hasRecordedWebcam: boolean;
};

export function CameraSection({ doc, hasRecordedWebcam, onUpdate }: CameraSectionProps) {
  return (
    <div className="grid gap-4">
      <SwitchRow
        checked={doc.camOn}
        disabled={!hasRecordedWebcam}
        hint={hasRecordedWebcam ? undefined : "No recorded webcam track in this project."}
        label="Include camera"
        onChange={(camOn) => onUpdate({ camOn })}
      />
      {doc.camOn ? (
        <>
          <CameraSliderControl
            label="Camera size"
            max={CAMERA_SIZE_MAX}
            min={CAMERA_SIZE_MIN}
            resetValue={CAMERA_SIZE_DEFAULT}
            value={doc.camScale}
            onChange={(camScale) => onUpdate({ camScale }, true)}
            onReset={() => onUpdate({ camScale: CAMERA_SIZE_DEFAULT })}
          />
          <Slider
            label="Camera volume"
            onChange={(webcamVol) => onUpdate({ webcamVol }, true)}
            value={doc.webcamVol ?? 100}
          />
          <CameraSliderControl
            label="Roundness"
            resetValue={CAMERA_ROUNDNESS_DEFAULT}
            value={doc.camRoundness}
            onChange={(camRoundness) => onUpdate({ camRoundness }, true)}
            onReset={() => onUpdate({ camRoundness: CAMERA_ROUNDNESS_DEFAULT })}
          />
          <CameraShapePicker value={doc.camShape} onChange={(camShape) => onUpdate({ camShape })} />
          <SwitchRow
            checked={doc.mirror}
            label="Mirror"
            onChange={(mirror) => onUpdate({ mirror })}
          />
          <Slider
            label="Crop position"
            onChange={(crop) => onUpdate({ crop }, true)}
            value={doc.crop}
          />
        </>
      ) : null}
    </div>
  );
}

function CameraSliderControl({
  label,
  value,
  min = 0,
  max = 100,
  resetValue,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  resetValue: number;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
      <Slider
        className="min-w-0"
        label={label}
        max={max}
        min={min}
        onChange={onChange}
        tone="accent"
        value={value}
      />
      <Button disabled={value === resetValue} onClick={onReset} size="mini">
        Reset
      </Button>
    </div>
  );
}

function CameraShapePicker({
  value,
  onChange,
}: {
  value: CameraShape;
  onChange: (shape: CameraShape) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="text-fg-2 mb-2 text-[12.5px]">Shape</div>
      <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CAMERA_SHAPES.map((shape) => {
          const selected = value === shape.id;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "rd-press shrink-0 cursor-pointer rounded-[8px] border px-3 py-2 text-[12px] font-medium capitalize",
                selected
                  ? "border-accent bg-accent/[12%] text-fg shadow-selected"
                  : "border-transparent bg-raised-alt-top text-fg-2 hover:text-fg"
              )}
              key={shape.id}
              onClick={() => onChange(shape.id)}
              type="button"
            >
              {shape.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
