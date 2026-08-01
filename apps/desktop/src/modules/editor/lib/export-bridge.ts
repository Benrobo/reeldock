import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { CanvasRatio } from "@reeldock/shared";
import type { ProjectDoc } from "@/modules/project";
import type { SourceTrackRecord } from "@/services";

const exportProjectResultSchema = z.object({
  ok: z.boolean(),
  outputPath: z.string(),
  durationMs: z.number().int().positive(),
});

export type ExportProjectResult = z.infer<typeof exportProjectResultSchema>;

type ExportProjectInput = {
  projectId: string;
  outputPath: string;
  ratio: Exclude<CanvasRatio, "custom">;
  doc: ProjectDoc;
  tracks: SourceTrackRecord[];
};

export async function exportProject(input: ExportProjectInput) {
  const result = await invoke<unknown>("export_project", { input });
  return exportProjectResultSchema.parse(result);
}
