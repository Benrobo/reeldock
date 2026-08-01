import type { ProjectDoc } from "@/modules/project";

export type EditorSidebarUpdate = (patch: Partial<ProjectDoc>, quiet?: boolean) => void;

export type EditorSidebarSectionProps = {
  doc: ProjectDoc;
  onUpdate: EditorSidebarUpdate;
};
