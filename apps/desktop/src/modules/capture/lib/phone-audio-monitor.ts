import { invoke } from "@tauri-apps/api/core";

export async function startPhoneAudioMonitor(uniqueId: string, volume = 0.75) {
  return invoke<boolean>("start_phone_audio_monitor", { uniqueId, volume });
}

export async function stopPhoneAudioMonitor() {
  await invoke("stop_phone_audio_monitor");
}
