import { useCallback, useEffect, useMemo, useState } from "react";
import { preferencesService } from "@/services";
import { listCaptureSources } from "@/modules/capture/lib/bridge";
import {
  checkMediaRequirement,
  requestMediaRequirement,
  type MediaRequirement,
} from "@/modules/onboarding/lib/media-permissions";
import type {
  OnboardingRequirementKey,
  OnboardingRequirementStatus,
  OnboardingRequirements,
} from "@/modules/onboarding/types";

type OnboardingRequirementsState = {
  requirements: OnboardingRequirements;
  loading: boolean;
  saving: boolean;
  error: string | null;
  complete: boolean;
  pendingRequirements: OnboardingRequirementKey[];
  setRequirement: (
    requirement: OnboardingRequirementKey,
    status: OnboardingRequirementStatus
  ) => Promise<void>;
  requestRequirement: (requirement: MediaRequirement) => Promise<void>;
  reload: () => Promise<void>;
};

const defaultRequirements: OnboardingRequirements = {
  camera: "pending",
  microphone: "pending",
  phone: "pending",
};

function getPendingRequirements(requirements: OnboardingRequirements): OnboardingRequirementKey[] {
  return Object.entries(requirements)
    .filter(([, status]) => status !== "granted")
    .map(([requirement]) => requirement as OnboardingRequirementKey);
}

async function readPhoneRequirement(stored: OnboardingRequirementStatus) {
  const sources = await listCaptureSources().catch(() => []);
  const available = sources.some(
    (source) => source.kind === "phone" && source.state === "available"
  );
  return available ? "granted" : stored;
}

export function useOnboardingRequirements(): OnboardingRequirementsState {
  const [requirements, setRequirements] = useState<OnboardingRequirements>(defaultRequirements);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const preferences = await preferencesService.get();
      const [camera, microphone, phone] = await Promise.all([
        checkMediaRequirement("camera"),
        checkMediaRequirement("microphone"),
        readPhoneRequirement(preferences.onboardingRequirements.phone),
      ]);

      setRequirements({ camera, microphone, phone });
      if (phone !== preferences.onboardingRequirements.phone) {
        await preferencesService.save({ onboardingRequirements: { phone } });
      }
      setError(null);
    } catch {
      setError("Local SQLite storage is required to track onboarding progress.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setRequirement = useCallback(
    async (requirement: OnboardingRequirementKey, status: OnboardingRequirementStatus) => {
      if (requirement !== "phone") return;

      setSaving(true);
      try {
        await preferencesService.save({ onboardingRequirements: { phone: status } });
        setRequirements((current) => ({ ...current, phone: status }));
        setError(null);
      } catch {
        setError("Could not save onboarding progress to local SQLite.");
        throw new Error("Could not save onboarding progress");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const requestRequirement = useCallback(async (requirement: MediaRequirement) => {
    setSaving(true);
    try {
      const status = await requestMediaRequirement(requirement);
      setRequirements((current) => ({ ...current, [requirement]: status }));
      if (status !== "granted") {
        throw new Error(`${requirement} permission was not granted`);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const pendingRequirements = useMemo(() => getPendingRequirements(requirements), [requirements]);

  return {
    requirements,
    loading,
    saving,
    error,
    complete: pendingRequirements.length === 0,
    pendingRequirements,
    setRequirement,
    requestRequirement,
    reload,
  };
}
