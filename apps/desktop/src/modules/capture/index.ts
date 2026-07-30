export { useCaptureSources } from "./hooks/use-capture-sources";
export { useMicrophoneMeter } from "./hooks/use-microphone-meter";
export { usePhoneAudioMonitor } from "./hooks/use-phone-audio-monitor";
export { listCaptureSources } from "./lib/bridge";
export {
  readMicrophoneMeter,
  startMicrophoneMeter,
  stopMicrophoneMeter,
  type MicrophoneMeterSnapshot,
} from "./lib/microphone-meter";
export { startPhoneAudioMonitor, stopPhoneAudioMonitor } from "./lib/phone-audio-monitor";
export {
  nativeRecordingKind,
  prepareRecording,
  recordingFilePath,
  startRecording,
  stopRecording,
  type NativeRecordingKind,
  type PrepareRecordingInput,
  type RecordingTrackResult,
} from "./lib/recording-bridge";
export { captureSourceSchema, type CaptureSource } from "./types";
