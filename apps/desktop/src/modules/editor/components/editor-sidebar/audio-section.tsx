import { Slider, SwitchRow, cn } from "@reeldock/ui";
import type { EditorSidebarSectionProps } from "./types";

type AudioSectionProps = EditorSidebarSectionProps & {
  hasRecordedMicrophone: boolean;
};

export function AudioSection({ doc, hasRecordedMicrophone, onUpdate }: AudioSectionProps) {
  return (
    <div className="grid gap-4">
      <SwitchRow
        checked={doc.muted}
        disabled={!hasRecordedMicrophone}
        hint={hasRecordedMicrophone ? undefined : "No recorded microphone track in this project."}
        label="Mute microphone"
        onChange={(muted) => onUpdate({ muted })}
      />
      <div className={cn(!hasRecordedMicrophone && "pointer-events-none opacity-45")}>
        <Slider label="Microphone" onChange={(mic) => onUpdate({ mic }, true)} value={doc.mic} />
      </div>
    </div>
  );
}
