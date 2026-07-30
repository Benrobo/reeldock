import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { CaptureSource } from "@/modules/capture/types";

const recordingKindSchema = z.enum(["phone", "webcam", "microphone"]);

const recordingTrackResultSchema = z.object({
  kind: recordingKindSchema,
  state: z.enum(["planned", "recording", "recorded", "failed"]),
  filePath: z.string().nullable().optional(),
  startOffsetMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  error: z.string().nullable().optional(),
});

const prepareRecordingResultSchema = z.object({
  ok: z.boolean(),
  projectId: z.string(),
  tracks: z.array(recordingTrackResultSchema),
});

const startRecordingResultSchema = z.object({
  startedAtHostTimeNs: z.string(),
  tracks: z.array(recordingTrackResultSchema),
});

const stopRecordingResultSchema = z.object({
  durationMs: z.number().int().nonnegative(),
  tracks: z.array(recordingTrackResultSchema),
});

export type NativeRecordingKind = z.infer<typeof recordingKindSchema>;
export type RecordingTrackResult = z.infer<typeof recordingTrackResultSchema>;
export type PrepareRecordingResult = z.infer<typeof prepareRecordingResultSchema>;
export type StartRecordingResult = z.infer<typeof startRecordingResultSchema>;
export type StopRecordingResult = z.infer<typeof stopRecordingResultSchema>;

export type PrepareRecordingInput = {
  projectId: string;
  projectPath: string;
  sources: Array<{
    kind: NativeRecordingKind;
    uniqueId: string;
    enabled: boolean;
  }>;
  files: Array<{
    kind: NativeRecordingKind;
    path: string;
  }>;
};

export function recordingFileName(kind: NativeRecordingKind) {
  if (kind === "microphone") return "microphone.mov";
  if (kind === "webcam") return "webcam.mov";
  return "phone.mov";
}

export function recordingFilePath(projectPath: string, kind: NativeRecordingKind) {
  return `${projectPath}/${recordingFileName(kind)}`;
}

export function nativeRecordingKind(source: CaptureSource): NativeRecordingKind {
  return recordingKindSchema.parse(source.kind);
}

export async function prepareRecording(input: PrepareRecordingInput) {
  const result = await invoke<unknown>("prepare_recording", { input });
  return prepareRecordingResultSchema.parse(result);
}

export async function startRecording(projectId: string) {
  const result = await invoke<unknown>("start_recording", { projectId });
  return startRecordingResultSchema.parse(result);
}

export async function stopRecording(projectId: string) {
  const result = await invoke<unknown>("stop_recording", { projectId });
  return stopRecordingResultSchema.parse(result);
}
