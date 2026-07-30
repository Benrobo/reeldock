import { useEffect, useState } from "react";
import { canUseLocalDb } from "@/db/local";
import {
  startPhoneAudioMonitor,
  stopPhoneAudioMonitor,
} from "@/modules/capture/lib/phone-audio-monitor";

export function usePhoneAudioMonitor(uniqueId: string | undefined, enabled: boolean) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!uniqueId || !enabled || !canUseLocalDb()) {
      setActive(false);
      void stopPhoneAudioMonitor().catch(() => {});
      return;
    }

    let cancelled = false;
    let retry: number | undefined;

    const start = async () => {
      try {
        const started = await startPhoneAudioMonitor(uniqueId);
        if (!cancelled) setActive(started);
        if (!started && !cancelled) retry = window.setTimeout(() => void start(), 250);
      } catch {
        if (!cancelled) setActive(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (retry) window.clearTimeout(retry);
      setActive(false);
      void stopPhoneAudioMonitor().catch(() => {});
    };
  }, [enabled, uniqueId]);

  return active;
}
