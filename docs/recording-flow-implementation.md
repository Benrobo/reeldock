# Recording Flow Implementation Plan

This note defines what should happen when the user clicks `Record`.

The app now keeps the recording flow on the setup screen and calls native recording commands. Swift starts native capture sessions and writes media files while React stays on the setup/recording surface.

## The Product Behaviour

The setup page should become the recording surface.

The user should not click `Record` and immediately jump to another page. The realistic flow is:

1. User selects phone, camera, microphone, and optional phone sound.
2. User clicks `Record`.
3. React validates that the required sources are still available.
4. React creates or reuses the `.reeldock` project folder.
5. React asks Rust/Swift to prepare the selected native recorders.
6. The UI shows a countdown: `3`, `2`, `1`.
7. The UI plays countdown sounds.
8. After the countdown, React calls the native `start_recording` command.
9. Swift records each selected source into its own file.
10. The same setup preview stays visible while recording.
11. The sidebar becomes a compact recording status panel.
12. The footer changes from `Record` to `Stop`.
13. User clicks `Stop`.
14. React calls the native `stop_recording` command.
15. Swift finalizes files and returns recorded track metadata.
16. React saves track paths, durations, offsets, and project status.
17. React navigates to the editor.

The old `/record` route has been removed for now. Do not bring it back just to simulate recording. A dedicated full-screen recording route can return later only if there is a strong UX reason. The setup page already has the live preview, source state, and record button, so it is the right place to transition into active recording.

## Current Implementation Status

The first native recording pass is implemented:

- React creates a project on setup.
- React prepares native recording outputs before countdown.
- Swift records selected phone and webcam sources with `AVCaptureMovieFileOutput`.
- Swift records the selected microphone with `AVCaptureAudioFileOutput`.
- Phone and webcam recording reuse the active native preview sessions when possible.
- Stop finalizes native files and returns track paths, states, offsets, and durations.
- React writes those results into `source_tracks`.
- React navigates to the editor after successful finalization.

This still needs physical-device validation with a connected iPhone, webcam, and microphone before it can be called reliable.

## Why The Countdown Is UI, Not Recording

The countdown is only the user-facing lead-in. It should not create fake timing.

The actual project timeline starts when native recording starts successfully.

```text
Click Record
  -> create project
  -> prepare native sessions
  -> countdown 3, 2, 1
  -> start native recording
  -> native start timestamp becomes time zero
```

If the countdown starts but native recording fails, the project should not pretend it recorded anything. Show an error and keep the user on setup.

## The State Machine

Use explicit states instead of scattered booleans.

```ts
type SetupRecordingState =
  | { status: "idle" }
  | { status: "creating-project" }
  | { status: "preparing-native-recorders" }
  | { status: "counting-down"; value: 3 | 2 | 1 }
  | { status: "starting-native-recording" }
  | { status: "recording"; startedAtMs: number; elapsedMs: number }
  | { status: "stopping" }
  | { status: "failed"; message: string };
```

This gives the UI one source of truth:

- `idle`: show source controls and `Record`.
- `creating-project`: disable source changes.
- `preparing-native-recorders`: show `Preparing sources`.
- `counting-down`: show a large centered `3`, `2`, or `1` over the preview.
- `starting-native-recording`: show `Starting`.
- `recording`: show timer, active source states, and `Stop`.
- `stopping`: disable stop and show `Finalizing files`.
- `failed`: show the plain error and let the user try again.

## UI Sound Hook

The hook you suggested makes sense for UI feedback. In this app it should live in the desktop app, probably:

```text
apps/desktop/src/hooks/use-ui-sound.ts
```

The package is not currently installed, so implementation would also require:

```bash
bun --filter @reeldock/desktop add @hookraft/use-sound
```

The hook shape can be:

```ts
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
    playCountdown: () => play("select", { volume: 0.45, pitch: "high" }),
    playRecordStart: () => play("success", { volume: 0.5, pitch: "mid" }),
    playRecordStop: () => play("modal-close", { volume: 0.45, pitch: "low" }),
    play,
  };
}

export type UiSound = ReturnType<typeof useUiSound>;
```

Do not add `"use client"` in the Vite desktop app. That directive is for React Server Component environments such as Next.js app routes. ReelDock desktop components already run on the client.

## Countdown Hook

The countdown should be small and reusable.

```ts
type CountdownOptions = {
  seconds: 3;
  onTick: (value: number) => void;
  onDone: () => void;
};

export function runCountdown({ seconds, onTick, onDone }: CountdownOptions) {
  let current = seconds;
  onTick(current);

  const timer = window.setInterval(() => {
    current -= 1;

    if (current <= 0) {
      window.clearInterval(timer);
      onDone();
      return;
    }

    onTick(current);
  }, 1000);

  return () => window.clearInterval(timer);
}
```

For React, this can become a hook if cancellation and component lifecycle need to be handled:

```ts
function useRecordingCountdown() {
  const timerRef = useRef<number | null>(null);

  const stop = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = (onTick: (value: 3 | 2 | 1) => void, onDone: () => void) => {
    stop();
    let current = 3;
    onTick(current);

    timerRef.current = window.setInterval(() => {
      current -= 1;
      if (current === 0) {
        stop();
        onDone();
        return;
      }
      onTick(current as 3 | 2 | 1);
    }, 1000);
  };

  useEffect(() => stop, []);

  return { start, stop };
}
```

## React Recording Orchestrator

The setup page should not contain all recording logic directly. Put the flow into a hook:

```text
apps/desktop/src/modules/setup/hooks/use-setup-recording.ts
```

The hook should receive:

- selected source IDs
- selected source labels
- current project state
- project document
- callbacks for loading project state
- navigation after recording finishes

The page should only call:

```ts
const recording = useSetupRecording({
  setupSources,
  activeProject,
  doc,
  onboardingComplete: onboarding.complete,
});

<Button
  disabled={!recording.canRecord}
  onClick={() => void recording.start()}
>
  {recording.primaryActionLabel}
</Button>
```

The hook should do the sequencing:

```ts
async function start() {
  setState({ status: "creating-project" });

  const project = await createOrReuseProject();
  const filePlan = recordingFilePlan(project.path, setupSources);

  setState({ status: "preparing-native-recorders" });
  await prepareRecording({
    projectId: project.id,
    projectPath: project.path,
    sources: selectedNativeSources(setupSources),
    files: filePlan,
  });

  await countdown();

  setState({ status: "starting-native-recording" });
  const started = await startRecording({
    projectId: project.id,
    projectPath: project.path,
  });

  setState({
    status: "recording",
    startedAtMs: performance.now(),
    elapsedMs: 0,
  });
}
```

## Native Command Contract

The missing core is not UI. The missing core is these commands:

```ts
type PrepareRecordingInput = {
  projectId: string;
  projectPath: string;
  sources: Array<{
    kind: "phone" | "webcam" | "microphone" | "phone-audio";
    uniqueId: string;
    enabled: boolean;
  }>;
  files: Array<{
    kind: "phone" | "webcam" | "microphone" | "phone-audio";
    path: string;
  }>;
};

type StartRecordingResult = {
  startedAtHostTimeNs: string;
  tracks: Array<{
    kind: "phone" | "webcam" | "microphone" | "phone-audio";
    state: "recording" | "failed";
    filePath: string;
    startOffsetMs: number;
  }>;
};

type StopRecordingResult = {
  durationMs: number;
  tracks: Array<{
    kind: "phone" | "webcam" | "microphone" | "phone-audio";
    state: "recorded" | "failed";
    filePath: string | null;
    startOffsetMs: number;
    durationMs: number;
    error?: string;
  }>;
};
```

The Tauri commands should look like:

```ts
await invoke("prepare_recording", input);
const started = await invoke<StartRecordingResult>("start_recording", { projectId });
const stopped = await invoke<StopRecordingResult>("stop_recording", { projectId });
```

Rust should validate JSON, expand project paths, and call Swift through C ABI. Swift should own the `AVCaptureSession`, `AVAssetWriter` or `AVCaptureMovieFileOutput`, timestamps, and file finalization.

## File Plan

Each recording should write predictable files inside the `.reeldock` folder:

```text
demo.reeldock/
├── project.json
├── phone.mov
├── webcam.mov
├── microphone.m4a
├── phone-audio.m4a
└── exports/
```

For the first real implementation:

- `phone.mov` is required.
- `webcam.mov` is written only when webcam recording is enabled.
- `microphone.m4a` is written only when microphone recording is enabled.
- `phone-audio.m4a` stays disabled until native phone-audio recording is proven.

The database already has `source_tracks`, so after stopping, React should update each track with:

- `filePath`
- `state`
- `startOffsetMs`
- `durationMs`

## Same Page UI During Recording

The same setup page should visually change state instead of navigating away:

### Idle

- Big live preview
- Source controls
- Checklist
- `Record` button
- input meter

### Countdown

- Same live preview
- Source controls locked
- Large centered countdown number
- footer text: `Recording starts in 3`
- play a short tick sound for each number

### Recording

- Same live preview
- red recording pill
- timecode
- active source indicators
- stop button
- input meter
- sidebar shows locked source summary, not editable controls

### Stopping

- Same preview or frozen status state
- stop button disabled
- text: `Finalizing files`

### Failed

- Keep user on setup
- show the failed source and plain error
- let them retry after changing source selection

## What To Avoid

Do not start the countdown before the project folder exists.

Do not mark the project as `recording` until native recording has started successfully.

Do not navigate to `/record` just to simulate time passing.

Do not use React timers as the source of media duration truth. React timers are only for display. Swift/native timestamps are the source of truth.

Do not enable phone sound just because discovery says `hasAudio`. It must stay disabled until Swift writes and verifies `phone-audio.m4a`.

Do not send video frames or audio samples through Tauri commands.

## Recommended Implementation Order

1. Add frontend recording state on setup page with countdown and stop UI, but keep native recording command calls behind a small bridge file.
2. Add `useUiSound` and play click/countdown/start/stop sounds.
3. Add Tauri command types and placeholder commands that return clear `not implemented` errors.
4. Add the Rust command layer: `prepare_recording`, `start_recording`, `stop_recording`.
5. Add Swift proof for one source first: record iPhone video to `phone.mov`.
6. Add webcam recording to `webcam.mov`.
7. Add microphone recording to `microphone.m4a`.
8. Save returned file paths and timing data into `source_tracks`.
9. Navigate to editor only after `stop_recording` returns successfully or returns recoverable partial tracks.
10. Add phone audio only after the native layer proves non-silent audio samples can be received and written separately.

The first honest milestone is not the final UI. It is pressing `Record`, counting down, writing a real `phone.mov`, stopping, and seeing that file in the project folder.
