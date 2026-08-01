# Native Capture Beginner Roadmap

This file exists because ReelDock's native capture path is not obvious if you are new to macOS media work. The goal is to explain why the project uses Swift for iPhone, webcam, microphone, and phone-audio discovery instead of treating everything like normal web video.

## The Simple Mental Model

ReelDock records several streams:

- Phone screen video
- Webcam video
- Microphone audio
- Phone audio, when the iPhone capture path exposes it

Those are not just UI elements. They are hardware/media streams coming from macOS. The React app should show controls and layout. The native layer should discover, preview, record, timestamp, and write media files.

Think of the native side as the camera operator and recording engineer. Think of React as the control panel.

## What An Audio Device Is

An audio device is a source that only provides sound.

Examples:

- MacBook microphone
- USB microphone
- Camo Microphone
- External audio interface

In Swift/AVFoundation, this usually appears as an `AVCaptureDevice` that has the media type `.audio`.

For ReelDock, a normal microphone should become `microphone.mov` when recorded alone. When webcam recording is also enabled, the selected microphone audio should be embedded in `webcam.mov` so webcam mouth movement and voice use the same file clock.

## What A Video Device Is

A video device is a source that provides images or frames.

Examples:

- MacBook camera
- USB webcam
- Camo Camera
- iPhone screen capture video

In Swift/AVFoundation, this usually appears as an `AVCaptureDevice` that has the media type `.video`.

For ReelDock, webcam video should become `webcam.mov`. Phone screen video should become `phone.mov`.

## What A Muxed Device Is

`muxed` means the media is bundled together.

The word comes from "multiplexed." In plain English: one device can carry more than one kind of media through the same capture path.

For example, an iPhone connected over USB can appear to macOS as a capture source like QuickTime's "New Movie Recording" source. That source may include:

- The phone screen as video
- The phone's app sound as audio

That does not mean the audio is a separate microphone. It may be part of the phone capture device.

This is why comparing QuickTime and ReelDock can be confusing:

- QuickTime may monitor the iPhone's muxed capture stream and play its audio.
- ReelDock's `Mic` dropdown only lists normal microphone devices.
- ReelDock's `Sound` row is the right place for phone audio, but it must stay disabled until Swift can actually record that audio into a separate synced file.

## Why The Swift Code Checks `.audio` And `.muxed`

The current discovery code does this:

```swift
if device.hasMediaType(.audio) || device.hasMediaType(.muxed) {
  result["hasAudio"] = true
}
```

In simple terms, this asks macOS:

"Does this capture device contain sound?"

We check `.audio` because a normal microphone is audio-only.

We check `.muxed` because a phone capture device may carry phone screen video and phone sound together.

This only proves that audio is present or possible on that capture device. It does not prove ReelDock is already recording phone audio. Recording phone audio still requires a native recorder path that receives audio sample buffers, timestamps them, and writes `phone-audio.m4a`.

## Why This Belongs In Swift, Not React

React runs inside the Tauri WebView. That is good for UI, buttons, lists, layout, and editor controls.

It is not the right layer for raw high-throughput media capture in this product.

Swift is used because:

- AVFoundation is Apple's native framework for cameras, microphones, preview layers, media files, and timestamps.
- CoreMediaIO is needed for the iPhone USB screen-capture path used by QuickTime.
- Native preview avoids sending full video frames through the JavaScript bridge.
- Native recording can write proper files with presentation timestamps.
- macOS permissions and device routing are native OS concerns.

The React side should receive metadata such as:

- Source label
- Source kind
- Unique ID
- Whether audio is detected
- Width and height
- State

The React side should not receive every raw audio sample or video frame.

## The Capture Pipeline

A basic native capture pipeline looks like this:

```text
Hardware device
  -> AVCaptureDevice
  -> AVCaptureDeviceInput
  -> AVCaptureSession
  -> output
  -> preview layer or file writer
```

For ReelDock, the finished product needs several pipelines running together:

```text
iPhone screen        -> phone.mov
Webcam               -> webcam.mov
Microphone           -> microphone.mov, or embedded in webcam.mov when webcam is enabled
iPhone audio stream  -> phone-audio.m4a, when supported
```

The hard part is not showing a preview. The hard part is recording all streams independently while keeping their timestamps aligned.

## What Phone Audio Still Needs

Before the Sound toggle should be enabled, Swift must prove all of this on a real iPhone:

- The iPhone capture source exposes audio.
- ReelDock can create an audio input or output for that stream.
- ReelDock receives non-silent audio samples while the phone is playing sound.
- ReelDock writes those samples to `phone-audio.m4a`.
- The phone-audio file has timestamps that sync with `phone.mov`.
- Disconnecting the phone finalizes files cleanly.
- The editor can mute and mix microphone audio separately from phone audio.

Until that exists, the UI can say audio was detected, but it should not let the user turn on phone sound as if recording is complete.

## What To Learn To Build This Without AI

### Stage 1: Programming Foundation

Learn enough Swift to be comfortable with:

- Functions and structs
- Optionals
- Arrays and dictionaries
- Error handling
- Async work and dispatch queues
- Small command line tools

Learn enough TypeScript/React to understand:

- Components and props
- Hooks
- State
- Forms and controls
- Data validation with schemas

Learn enough Rust/Tauri to understand:

- Tauri commands
- JSON serialization
- FFI boundary basics
- Passing safe metadata between native code and the UI

### Stage 2: Media Basics

Learn these concepts before going too deep into AVFoundation:

- A video is a sequence of frames.
- Audio is a sequence of samples.
- A timestamp says when a frame or sample should play.
- A codec compresses media, such as H.264 or AAC.
- A container stores tracks together, such as `.mov`, `.mp4`, or `.m4a`.
- Muxing means combining multiple tracks into one container.
- Demuxing means separating tracks from a container or stream.

### Stage 3: AVFoundation Basics

Build small experiments in this order:

1. List all cameras and microphones on the Mac.
2. Show the Mac webcam in an `AVCaptureVideoPreviewLayer`.
3. Record the Mac microphone to an audio file.
4. Record the Mac webcam to a movie file.
5. Record webcam and microphone at the same time.
6. Inspect timestamps from video frames and audio samples.
7. Use `AVAssetWriter` to write samples yourself.

### Stage 4: iPhone Capture

Then focus on the risky part:

1. Enable CoreMediaIO screen-capture devices.
2. Discover the USB iPhone capture device.
3. Print its label, unique ID, media types, dimensions, and formats.
4. Preview the iPhone screen in a native layer.
5. Record the iPhone screen to `phone.mov`.
6. Check whether the iPhone device reports `.audio` or `.muxed`.
7. Try to receive phone audio samples while playing sound on the phone.
8. Write those samples to `phone-audio.m4a`.

### Stage 5: Multi-Source Recording

After each individual source works, combine them:

1. Start phone, webcam, microphone, and phone-audio capture together.
2. Store each source in its own file.
3. Store start offsets and timestamps.
4. Test long recordings for drift.
5. Test unplugging the phone mid-recording.
6. Test changing microphones and cameras.
7. Test permissions denied and permissions restored.

### Stage 6: Tauri Integration

Only after native capture works:

1. Expose source discovery through a Tauri command.
2. Return metadata only, not raw frames.
3. Let React choose source IDs and toggles.
4. Send selected IDs back to the native recorder.
5. Keep preview native.
6. Keep recording native.

### Stage 7: Editor And Export

Finally:

1. Load the separate recorded files.
2. Use `AVMutableComposition` to put tracks on one timeline.
3. Use `AVMutableVideoComposition` for layout, scaling, masks, and backgrounds.
4. Use `AVMutableAudioMix` for microphone and phone-audio volume.
5. Export MP4.
6. Compare export against the editor preview.

## Good First Debug Prints

When confused, print facts from Swift instead of guessing:

```swift
print(device.localizedName)
print(device.uniqueID)
print(device.hasMediaType(.video))
print(device.hasMediaType(.audio))
print(device.hasMediaType(.muxed))
print(device.activeFormat)
```

For this project, the question is usually:

"What does macOS say this physical source can provide?"

Then the next question is:

"Have we actually built the recorder that writes that stream?"

Those are two different questions.

## References

- Apple AVFoundation: https://developer.apple.com/documentation/avfoundation/
- Apple capture setup overview: https://developer.apple.com/documentation/avfoundation/capture-setup
- Apple `AVCaptureDevice`: https://developer.apple.com/documentation/avfoundation/avcapturedevice
- Apple `AVCaptureDevice.DiscoverySession`: https://developer.apple.com/documentation/avfoundation/avcapturedevice/discoverysession
- Apple `AVCaptureSession`: https://developer.apple.com/documentation/avfoundation/avcapturesession
- Apple `AVMediaType.muxed`: https://developer.apple.com/documentation/avfoundation/avmediatype/muxed
- ReelDock phone audio warning: `docs/phone-audio-capture.md`
