import { invoke } from "@tauri-apps/api/core";
import type { ProjectDoc } from "@/modules/project";

export const projectFilesService = {
  async writeProjectDocument(path: string, doc: ProjectDoc) {
    await invoke("write_project_document", {
      path,
      docJson: JSON.stringify(doc, null, 2),
    });
  },

  async revealProjectInFinder(path: string) {
    await invoke("reveal_project_in_finder", { path });
  },
};
