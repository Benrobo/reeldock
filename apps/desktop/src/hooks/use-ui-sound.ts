import { useSound } from "@hookraft/use-sound";

type SoundName = Parameters<ReturnType<typeof useSound>["play"]>[0];
type SoundOptions = Parameters<ReturnType<typeof useSound>["play"]>[1];

export type { SoundName, SoundOptions };

export function useUiSound() {
  const { play } = useSound({ theme: "glass", globalVolume: 0.35 });

  return {
    playClick: () => play("click", { volume: 0.3 }),
    playSelect: () => play("toggle-on", { pitch: "low" }),
    playDeselect: () => play("toggle-off", { pitch: "mid" }),
    playSuccess: () => play("success", { volume: 0.5, pitch: "high" }),
    playError: () => play("error", { volume: 0.4 }),
    playOpen: () => play("modal-open", { pitch: "high" }),
    playClose: () => play("modal-close", { pitch: "low" }),
    playCountdown: () => play("pop", { volume: 0.42, pitch: "high" }),
    playRecordStart: () => play("success", { volume: 0.5, pitch: "mid" }),
    playRecordStop: () => play("modal-close", { volume: 0.45, pitch: "low" }),
    play,
  };
}

export type UiSound = ReturnType<typeof useUiSound>;
