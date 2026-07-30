import { useEffect, useState } from "react";
import { canUseLocalDb } from "@/db/local";
import {
  readMicrophoneMeter,
  startMicrophoneMeter,
  stopMicrophoneMeter,
  type MicrophoneMeterSnapshot,
} from "@/modules/capture/lib/microphone-meter";

const POLL_INTERVAL_MS = 50;

const idleMeter: MicrophoneMeterSnapshot = {
  active: false,
  level: 0,
  peak: 0,
  uniqueId: null,
};

export function useMicrophoneMeter(
  uniqueId: string | undefined,
  enabled: boolean
) {
  const [meter, setMeter] = useState<MicrophoneMeterSnapshot>(idleMeter);

  useEffect(() => {
    if (!uniqueId || !enabled || !canUseLocalDb()) {
      setMeter(idleMeter);
      void stopMicrophoneMeter().catch(() => {});
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const snapshot = await readMicrophoneMeter();
        if (!cancelled) setMeter(snapshot);
      } catch {
        if (!cancelled) setMeter(idleMeter);
      }
    };

    void startMicrophoneMeter(uniqueId)
      .then(() => poll())
      .catch(() => {
        if (!cancelled) setMeter(idleMeter);
      });

    timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      setMeter(idleMeter);
      void stopMicrophoneMeter().catch(() => {});
    };
  }, [enabled, uniqueId]);

  return meter;
}
