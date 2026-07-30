import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

const microphoneMeterSchema = z.object({
  active: z.boolean().catch(false),
  level: z.number().min(0).max(1).catch(0),
  peak: z.number().min(0).max(1).catch(0),
  uniqueId: z.string().nullable().optional(),
});

export type MicrophoneMeterSnapshot = z.infer<typeof microphoneMeterSchema>;

export async function startMicrophoneMeter(uniqueId: string) {
  await invoke("start_microphone_meter", { uniqueId });
}

export async function stopMicrophoneMeter() {
  await invoke("stop_microphone_meter");
}

export async function readMicrophoneMeter() {
  const result = await invoke<unknown>("microphone_meter");
  return microphoneMeterSchema.parse(result);
}
