import { invoke } from "@tauri-apps/api/core";
import {
  checkCameraPermission,
  checkMicrophonePermission,
  requestCameraPermission,
  requestMicrophonePermission,
} from "tauri-plugin-macos-permissions-api";
import type {
  OnboardingRequirementKey,
  OnboardingRequirementStatus,
} from "@/modules/onboarding/types";

export type MediaRequirement = Extract<OnboardingRequirementKey, "camera" | "microphone">;

const permissionChecks = {
  camera: checkCameraPermission,
  microphone: checkMicrophonePermission,
} as const satisfies Record<MediaRequirement, () => Promise<boolean>>;

const permissionRequests = {
  camera: requestCameraPermission,
  microphone: requestMicrophonePermission,
} as const satisfies Record<MediaRequirement, () => Promise<unknown>>;

export async function checkMediaRequirement(
  requirement: MediaRequirement
): Promise<OnboardingRequirementStatus> {
  return (await permissionChecks[requirement]()) ? "granted" : "pending";
}

export async function requestMediaRequirement(
  requirement: MediaRequirement
): Promise<OnboardingRequirementStatus> {
  await permissionRequests[requirement]();
  return (await permissionChecks[requirement]()) ? "granted" : "denied";
}

export async function openPrivacySettings(requirement: MediaRequirement) {
  await invoke("open_privacy_settings", { requirement });
}
