import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { captureSourceSchema, type CaptureSource } from "@/modules/capture/types";

export async function listCaptureSources(): Promise<CaptureSource[]> {
  const sources = await invoke<unknown>("list_capture_sources");
  return z.array(captureSourceSchema).parse(sources);
}
