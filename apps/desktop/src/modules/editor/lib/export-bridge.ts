import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

const exportProgressSchema = z.object({
  projectId: z.string(),
  progress: z.number().min(0).max(100),
  stage: z.string(),
});

export type ExportProgress = z.infer<typeof exportProgressSchema>;

type ExportProjectInput = {
  projectId: string;
  outputPath: string;
  ratio: CanvasRatio;
  doc: ProjectDoc;
  tracks: SourceTrackRecord[];
  onProgress?: (event: ExportProgress) => void;
};

export async function exportProject(input: ExportProjectInput) {
  const { onProgress, ...commandInput } = input;
  const unlisten = onProgress
    ? await listen("export-progress", (event) => {
        const parsed = exportProgressSchema.safeParse(event.payload);
        if (!parsed.success || parsed.data.projectId !== input.projectId) return;
        onProgress(parsed.data);
      })
    : null;

  try {
    const result = await invoke<unknown>("export_project", { input: commandInput });
    return exportProjectResultSchema.parse(result);
  } finally {
    unlisten?.();
  }
}
