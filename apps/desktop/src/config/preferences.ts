import { RECORDING_QUALITY_LABEL } from "@/constants/recording";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";

export const PREFERENCE_TABS = ["General", "Devices", "Recording", "Export"] as const;

export const DEFAULT_PREFERENCES = {
  defaultProjectName: "ReelDock demo",
  openEditorAfterRecording: true,
  recordingsPath: REELDOCK_RECORDINGS_DIR,
  recordingQuality: RECORDING_QUALITY_LABEL,
  phoneCapture: "USB iPhone",
  hardwareAcceleration: true,
  showPhoneAudioMonitoringControlDuringRecordingSetup: false,
  selectedSources: {},
  onboardingRequirements: {
    phone: "pending",
  },
} as const;

export type PreferenceKey = keyof typeof DEFAULT_PREFERENCES;
