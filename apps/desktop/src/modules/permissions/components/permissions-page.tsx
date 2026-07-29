import {
  Bug02Icon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  Mic01Icon,
  SmartPhone01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { ActivitySpinner, Banner, Button, Panel, SurfaceRow } from "@reeldock/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ColorIcon } from "@/components/color-icon";
import { openDesktopDevtools } from "@/modules/devtools";
import type { OnboardingRequirementKey } from "@/modules/onboarding";
import { openPrivacySettings, useOnboardingRequirements } from "@/modules/onboarding";

const permissionRows = [
  {
    key: "camera",
    label: "Camera",
    hint: "Records your face alongside the phone.",
    icon: CameraVideoIcon,
  },
  {
    key: "microphone",
    label: "Microphone",
    hint: "Records narration to its own audio file.",
    icon: Mic01Icon,
  },
  {
    key: "phone",
    label: "Connected iPhone",
    hint: "Unlock the phone and tap Trust when asked.",
    icon: SmartPhone01Icon,
  },
] as const satisfies ReadonlyArray<{
  key: OnboardingRequirementKey;
  label: string;
  hint: string;
  icon: typeof CameraVideoIcon;
}>;

export function PermissionsPage() {
  const navigate = useNavigate();
  const {
    requirements,
    loading,
    saving,
    error,
    complete,
    reload,
    setRequirement,
    requestRequirement,
  } = useOnboardingRequirements();
  const [activeRequirement, setActiveRequirement] = useState<OnboardingRequirementKey | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const grantMediaRequirement = async (
    requirement: Extract<OnboardingRequirementKey, "camera" | "microphone">
  ) => {
    setActiveRequirement(requirement);
    setPermissionError(null);
    try {
      await requestRequirement(requirement);
    } catch {
      setPermissionError(
        requirement === "camera"
          ? "Camera access was not granted. Open System Settings > Privacy & Security > Camera, enable ReelDock, then return here and click Check."
          : "Microphone access was not granted. Open System Settings > Privacy & Security > Microphone, enable ReelDock, then return here and click Check."
      );
    } finally {
      setActiveRequirement(null);
    }
  };

  const markPhoneTrusted = async () => {
    setActiveRequirement("phone");
    setPermissionError(null);
    try {
      await setRequirement("phone", "granted");
    } finally {
      setActiveRequirement(null);
    }
  };

  const showDevtools = async () => {
    setPermissionError(null);
    try {
      await openDesktopDevtools();
    } catch {
      setPermissionError("Could not open the devtools window.");
    }
  };

  const continueToSetup = async () => {
    if (!complete) return;
    await navigate({ to: "/setup" });
  };

  const renderAction = (requirement: OnboardingRequirementKey) => {
    const status = requirements[requirement];
    const busy = saving && activeRequirement === requirement;

    if (loading) {
      return <ActivitySpinner size={16} />;
    }

    if (status === "granted") {
      return (
        <span className="text-ok flex items-center gap-1.5 text-xs font-semibold">
          <ColorIcon icon={CheckmarkCircle02Icon} size={16} tone="export" />
          {requirement === "phone" ? "Trusted" : "Allowed"}
        </span>
      );
    }

    if (requirement === "phone") {
      return (
        <Button
          disabled={busy}
          onClick={() => void markPhoneTrusted()}
          size="mini"
          variant="accent"
        >
          {busy ? <ActivitySpinner size={14} /> : "I trusted it"}
        </Button>
      );
    }

    if (status === "denied") {
      return (
        <div className="flex items-center gap-2">
          <Button onClick={() => void openPrivacySettings(requirement)} size="mini">
            Open Settings
          </Button>
          <Button disabled={loading} onClick={() => void reload()} size="mini" variant="accent">
            {loading ? <ActivitySpinner size={14} /> : "Check"}
          </Button>
        </div>
      );
    }

    return (
      <Button
        disabled={busy}
        onClick={() => void grantMediaRequirement(requirement)}
        size="mini"
        variant="accent"
      >
        {busy ? <ActivitySpinner size={14} /> : "Allow"}
      </Button>
    );
  };

  return (
    <main className="bg-window flex h-full items-center justify-center p-10">
      <div className="w-[520px]">
        <Panel className="grid size-[60px] place-items-center rounded-2xl p-0">
          <span className="bg-rec block size-5 rounded-full" />
        </Panel>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.024em]">Before you record</h1>
        <p className="text-fg-2 mt-2.5 text-[14.5px] leading-[1.55]">
          ReelDock records your iPhone, camera and microphone as separate files on this Mac. macOS
          asks for each one individually.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          {permissionRows.map((row) => (
            <SurfaceRow key={row.label}>
              <ColorIcon
                badge
                icon={row.icon}
                tone={row.key === "microphone" ? "microphone" : row.key}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">{row.label}</div>
                <div className="text-fg-3 mt-0.5 text-[12.5px]">{row.hint}</div>
              </div>
              {renderAction(row.key)}
            </SurfaceRow>
          ))}
        </div>

        {permissionError ? (
          <Banner className="mt-5" tone="rec">
            {permissionError}
          </Banner>
        ) : null}
        {error ? (
          <Banner className="mt-5" tone="warn">
            {error}
          </Banner>
        ) : null}

        <div className="mt-6 flex items-center gap-2.5">
          <Button
            disabled={!complete || loading || saving}
            onClick={() => void continueToSetup()}
            variant="bright"
          >
            Continue
          </Button>
          <span className="text-fg-3 text-[12.5px]">
            {complete ? "Ready to record." : "Complete every requirement before recording."}
          </span>
          <Button
            className="ml-auto"
            leading={<ColorIcon icon={Bug02Icon} size={15} tone="menu" />}
            onClick={() => void showDevtools()}
            size="mini"
          >
            Devtools
          </Button>
        </div>
      </div>
    </main>
  );
}
