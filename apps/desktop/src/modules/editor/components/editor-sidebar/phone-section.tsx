import { PHONE_ZOOM_MAX, PHONE_ZOOM_MIN } from "@reeldock/shared";
import { Slider, SwitchRow } from "@reeldock/ui";
import type { EditorSidebarSectionProps } from "./types";

export function PhoneSection({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="grid gap-4">
      <SwitchRow
        checked={doc.frame}
        label="Device frame"
        onChange={(frame) => onUpdate({ frame })}
      />
      <SwitchRow checked={doc.shadow} label="Shadow" onChange={(shadow) => onUpdate({ shadow })} />
      <Slider
        defaultValue={doc.radius}
        label="Corner radius"
        onChange={(radius) => onUpdate({ radius }, true)}
        value={doc.radius}
      />
      <Slider
        defaultValue={doc.zoom}
        label="Screen zoom"
        max={PHONE_ZOOM_MAX}
        min={PHONE_ZOOM_MIN}
        onChange={(zoom) => onUpdate({ zoom }, true)}
        value={doc.zoom}
      />
      <Slider
        label="Phone volume"
        onChange={(phoneVol) => onUpdate({ phoneVol }, true)}
        value={doc.phoneVol ?? 100}
      />
    </div>
  );
}
