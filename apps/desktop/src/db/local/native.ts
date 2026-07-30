import { invoke } from "@tauri-apps/api/core";
import type { NewProjectRow, NewSourceTrackRow } from "./schema";

export async function createProjectWithSourcesTransaction(
  project: NewProjectRow,
  sources: NewSourceTrackRow[]
) {
  await invoke("create_project_with_sources", { project, sources });
}

export async function deleteProjectTransaction(projectId: string) {
  await invoke("delete_project", { projectId });
}
