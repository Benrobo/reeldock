# Phone Audio Capture Warning

This file exists so future setup-screen work does not mistake a UI toggle for working phone-audio recording.

The phone preview is video from the iPhone capture device. That does not automatically mean ReelDock is recording the phone's sound. Phone audio must be proven in the native capture layer first.

The correct future implementation is:

- Detect whether the connected iPhone capture path exposes an audio stream.
- Record that phone audio as its own synchronized file, separate from phone video, webcam video, and microphone audio.
- Store the track as `phone-audio.m4a` only when the native recorder actually receives non-silent audio.
- Keep microphone audio and phone audio independent so the editor can mute, mix, or adjust them separately.
- Leave the setup UI disabled or clearly unavailable until the native capture path can prove the track works on physical devices.

If playing video on the iPhone makes the physical phone seem muted, macOS may be routing or taking ownership of that audio path while the USB capture device is active. Do not solve that by faking audio in React. The native recorder needs to inspect the AVFoundation/CoreMediaIO device inputs and record the real audio stream when macOS exposes one.

QuickTime being able to play or monitor phone audio means macOS can see audio on the iPhone capture path. It does not mean ReelDock is already recording that audio. The setup UI may show the stream as detected, but the toggle must stay disabled until Swift writes and verifies a separate phone-audio track.
