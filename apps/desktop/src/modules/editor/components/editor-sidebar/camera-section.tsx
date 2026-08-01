import { CAMERA_ROUNDNESS_DEFAULT } from "@reeldock/shared";
import { Button, Slider, SwitchRow } from "@reeldock/ui";
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
