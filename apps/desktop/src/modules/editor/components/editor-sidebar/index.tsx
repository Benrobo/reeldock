import type { ProjectDoc } from "@/modules/project";
import { EDITOR_SECTIONS, type EditorSection } from "../../data/editor-data";
import { AudioSection } from "./audio-section";
import { CameraSection } from "./camera-section";
import { CanvasSection } from "./canvas-section";
import { PhoneSection } from "./phone-section";

type EditorSidebarProps = {
  doc: ProjectDoc;
  hasRecordedMicrophone: boolean;
  hasRecordedWebcam: boolean;
  section: EditorSection;
  onSectionChange: (section: EditorSection) => void;
  onUpdate: (patch: Partial<ProjectDoc>, quiet?: boolean) => void;
};

export function EditorSidebar({
  doc,
  hasRecordedMicrophone,
  hasRecordedWebcam,
  section,
  onSectionChange,
  onUpdate,
}: EditorSidebarProps) {
  const selectedSection = EDITOR_SECTIONS.find((item) => item.id === section) ?? EDITOR_SECTIONS[0];

  return (
    <aside className="border-surface-line bg-surface flex h-full min-h-0 w-80 flex-col gap-5 overflow-y-auto rounded-[10px] border px-5 py-5">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.012em]">{selectedSection.title}</h2>
        <p className="text-fg-3 mt-[5px] text-[12.5px] leading-[1.5]">{selectedSection.hint}</p>
      </div>

      {section === "phone" ? <PhoneSection doc={doc} onUpdate={onUpdate} /> : null}

      {section === "camera" ? (
        <CameraSection doc={doc} hasRecordedWebcam={hasRecordedWebcam} onUpdate={onUpdate} />
      ) : null}

      {section === "canvas" ? <CanvasSection doc={doc} onUpdate={onUpdate} /> : null}

      {section === "audio" ? (
        <AudioSection doc={doc} hasRecordedMicrophone={hasRecordedMicrophone} onUpdate={onUpdate} />
      ) : null}

      <div className="flex-1" />
    </aside>
  );
}
