# ReelDock Product Requirements Document

**Product name:** ReelDock  
**Document type:** MVP Product Requirements Document  
**Status:** Draft  
**Primary platform:** macOS desktop  
**Primary framework:** Tauri  
**Initial use case:** Recording polished mobile-app demos for products such as Elorah

---

## 1. Product summary

ReelDock is a macOS desktop application for recording polished mobile-product demonstrations.

The application records multiple sources at the same time:

- A connected iPhone or Android device
- A webcam
- A microphone

Each source is stored separately so the user can change the final layout after recording.

The user can connect a phone, record an app walkthrough, optionally include their face and voice, rearrange the phone and webcam, change the background, trim the result, and export a polished marketing video.

ReelDock is not intended to be a general-purpose video editor. Its first purpose is to make mobile-app demo creation fast and repeatable.

---

## 2. Problem

Creating a polished mobile-app demo currently requires several separate steps:

1. Record the phone screen.
2. Record the webcam.
3. Record narration.
4. Import everything into another editor.
5. Synchronise all recordings.
6. Create a layout.
7. Add a device frame or background.
8. Export in the correct aspect ratio.

This workflow is slow, repetitive, and easy to get wrong.

It is especially inconvenient for founders and developers who frequently need to create:

- Landing-page videos
- Product walkthroughs
- Feature announcements
- App Store previews
- Social-media clips
- Support tutorials
- Build-in-public updates

ReelDock reduces this process to one recording session and one lightweight editing screen.

---

## 3. Product vision

ReelDock should feel like a small recording studio built specifically for mobile apps.

The ideal experience is:

> Connect your phone, press record, demonstrate your app, adjust the layout, and export.

The product should remove the technical work involved in combining phone footage, webcam footage, audio, framing, and backgrounds.

---

## 4. Target users

### Primary users

- Mobile-app founders
- Indie hackers
- Product designers
- Mobile developers
- Product marketers
- Technical creators
- Startup teams

### Initial internal user

The first real user is the ReelDock creator using it to produce marketing and demonstration videos for **Elorah**.

This internal use should guide the MVP. Features should be added because they improve a real recording workflow, not because competing editors contain them.

---

## 5. Main use cases

### 5.1 App-only product demo

The user records only the connected phone and microphone.

Example output:

- Elorah app walkthrough
- Landing-page hero video
- App Store preview
- Feature demonstration

### 5.2 Founder walkthrough

The user records:

- Phone
- Webcam
- Microphone

The phone and webcam appear beside each other or in a picture-in-picture layout.

### 5.3 Vertical social-media clip

The user records a mobile walkthrough and exports it in a 9:16 layout for:

- TikTok
- Instagram Reels
- YouTube Shorts
- X
- LinkedIn

### 5.4 Support or onboarding tutorial

The user records a step-by-step app flow with narration and exports a clean tutorial.

---

## 6. Product principles

### 6.1 Record sources separately

The phone, webcam, and microphone must remain independent media sources.

Do not permanently combine them during recording.

This allows the user to:

- Move the webcam
- Hide the webcam
- Resize the phone
- Change the layout
- Change the canvas ratio
- Adjust audio independently
- Re-export the same recording in another format

### 6.2 Layout-first editing

ReelDock should not begin as a full timeline editor.

The main editing experience should focus on:

- Position
- Size
- Shape
- Background
- Device frame
- Trim
- Audio
- Export

### 6.3 Fast setup

The user should be able to begin recording without configuring a complex project.

A sensible default layout should be selected automatically.

### 6.4 Local-first

Recordings and project data should remain on the user’s Mac by default.

The MVP does not require cloud storage or cloud rendering.

### 6.5 Honest platform behaviour

ReelDock should not promise that it can bypass Apple or Android security permissions.

The user may still need to:

- Trust the Mac on iPhone
- Grant camera and microphone permissions
- Enable USB debugging on Android
- Approve the connected computer

---

## 7. MVP scope

The MVP should prove that ReelDock can reliably record a mobile device, webcam, and microphone, then export a polished composition.

### Included in MVP

- macOS desktop application
- iPhone capture over USB
- Webcam capture
- Microphone capture
- Live recording preview
- Independent media tracks
- Recording start and stop
- Basic synchronisation
- Layout presets
- Manual resizing and repositioning
- Webcam shape controls
- Background colour selection
- Optional phone frame
- Start and end trimming
- Audio volume controls
- Export to MP4
- 16:9 export
- 9:16 export
- 1:1 export
- Local project saving
- Basic recovery after interrupted recording

### Excluded from MVP

- Full multi-track video editing
- Advanced transitions
- Automatic zoom effects
- AI editing
- AI captions
- Cloud rendering
- Team collaboration
- Template marketplace
- Screen annotation
- Cursor effects
- Teleprompter
- Multiple scenes
- Browser recording
- Windows support
- Remote phone connection
- Android support in the first release
- Automatic background removal
- Advanced colour grading

Android can be added after the iPhone workflow is stable.

---

## 8. Core user flow

### 8.1 First launch

1. User opens ReelDock.
2. ReelDock explains the required permissions.
3. User grants:
   - Camera permission
   - Microphone permission
4. ReelDock opens the recording setup screen.

### 8.2 Device connection

1. User connects an iPhone through USB.
2. ReelDock detects the phone.
3. The phone appears as a selectable video source.
4. ReelDock displays the live phone preview.
5. The user selects a webcam and microphone.
6. The user turns webcam recording on or off.

### 8.3 Recording setup

The user selects:

- Phone source
- Camera source
- Microphone source
- Initial layout
- Canvas ratio
- Recording quality

The user can see a live preview before recording.

### 8.4 Recording

1. User presses **Record**.
2. ReelDock starts all selected sources against one shared timeline.
3. ReelDock shows:
   - Recording duration
   - Active sources
   - Audio level
   - Device connection status
4. User demonstrates the mobile app.
5. User presses **Stop**.

### 8.5 Editing

After recording, ReelDock opens the project editor.

The user can:

- Trim the recording
- Move and resize the phone
- Move and resize the webcam
- Hide the webcam
- Change the webcam shape
- Change the background
- Add or remove a phone frame
- Change the canvas ratio
- Adjust microphone volume
- Adjust phone audio volume when available
- Preview the result

### 8.6 Export

1. User selects resolution and quality.
2. ReelDock renders the composition.
3. ReelDock exports an MP4.
4. User can reveal the exported file in Finder.

---

## 9. Layout presets

The MVP should include a small number of useful presets.

### 9.1 Phone focus

- Phone centred
- No webcam
- Background visible around the phone
- Suitable for landing pages and product demos

### 9.2 Side-by-side

- Phone on one side
- Webcam on the other
- Suitable for founder walkthroughs

### 9.3 Picture-in-picture

- Large phone
- Small circular or rounded webcam overlay
- Suitable for social content

### 9.4 Vertical demo

- 9:16 canvas
- Phone centred
- Optional webcam bubble
- Suitable for Reels, Shorts, and TikTok

The selected preset only defines initial positions. The user must still be able to adjust the elements manually.

---

## 10. Functional requirements

## 10.1 Device detection

ReelDock must:

- Detect connected iPhones supported by macOS capture APIs
- Detect built-in and external webcams
- Detect available microphones
- Update device lists when hardware is connected or disconnected
- Show clear errors when a source becomes unavailable

## 10.2 Phone capture

For the first version, ReelDock must support iPhone capture through a physical USB connection.

Requirements:

- Show live phone preview
- Record the phone at a stable frame rate
- Preserve the phone’s native orientation
- Handle portrait and landscape rotation
- Avoid requiring the iPhone’s local screen recorder
- Detect connection loss
- Stop or safely pause recording when the cable disconnects

### Dynamic Island behaviour

ReelDock should capture the iPhone externally from the Mac.

The product should not claim that it can disable Dynamic Island system content.

The setup screen should encourage the user to:

- Stop timers
- Stop calls
- Stop music playback when it activates the island
- Close active Live Activities
- Use a quiet recording environment

The live preview allows the user to verify the captured output before recording.

A top-crop option may be added as a fallback, but it should not be the primary solution.

## 10.3 Webcam capture

ReelDock must:

- Display the selected webcam
- Record webcam video independently
- Allow webcam recording to be disabled
- Support built-in and common USB webcams
- Preserve camera footage for layout changes after recording

## 10.4 Microphone capture

ReelDock must:

- Record the selected microphone independently
- Display live input level
- Warn when no audio is detected
- Allow the user to adjust microphone volume after recording
- Preserve audio synchronisation with the video sources

## 10.5 Synchronisation

All recorded sources must use one shared project timeline.

ReelDock must store enough timing information to correctly align:

- Phone video
- Webcam video
- Microphone audio
- Phone audio when supported

The product should not assume that all sources begin on the exact same frame.

## 10.6 Recording controls

The recording screen must include:

- Record
- Stop
- Recording duration
- Active source indicators
- Audio level
- Connection status
- Low-storage warning
- Error state

Pause and resume are optional for the first MVP.

## 10.7 Project editor

The editor must support:

- Phone position
- Phone size
- Phone corner radius
- Phone frame on or off
- Webcam position
- Webcam size
- Webcam shape
- Webcam visibility
- Background colour
- Canvas ratio
- Start trim
- End trim
- Microphone volume
- Phone audio volume when available
- Playback
- Seeking

## 10.8 Export

The MVP must export H.264 MP4.

Required aspect ratios:

- 16:9
- 9:16
- 1:1

Suggested output resolutions:

- 1920 × 1080
- 1080 × 1920
- 1080 × 1080

The exported file must match the editor preview closely.

---

## 11. Project file structure

Each ReelDock project should use a directory similar to:

```text
my-demo.reeldock/
├── project.json
├── phone.mov
├── webcam.mov
├── microphone.m4a
├── phone-audio.m4a
├── thumbnail.jpg
└── exports/
```

Files that do not exist should be optional.

Example `project.json`:

```json
{
  "version": 1,
  "name": "Elorah Reading Plan Demo",
  "createdAt": "2026-07-29T00:00:00Z",
  "durationMs": 64000,
  "canvas": {
    "aspectRatio": "16:9",
    "width": 1920,
    "height": 1080,
    "background": {
      "type": "colour",
      "value": "#F4F2EC"
    }
  },
  "sources": {
    "phone": {
      "file": "phone.mov",
      "startOffsetMs": 42,
      "rotation": 0
    },
    "webcam": {
      "file": "webcam.mov",
      "startOffsetMs": 71,
      "enabled": true
    },
    "microphone": {
      "file": "microphone.m4a",
      "startOffsetMs": 18,
      "volume": 1
    }
  },
  "layout": {
    "phone": {
      "x": 0.08,
      "y": 0.08,
      "width": 0.34,
      "height": 0.84,
      "cornerRadius": 42,
      "deviceFrame": "none"
    },
    "webcam": {
      "x": 0.48,
      "y": 0.12,
      "width": 0.44,
      "height": 0.72,
      "shape": "rounded-rectangle",
      "visible": true
    }
  },
  "trim": {
    "startMs": 0,
    "endMs": 64000
  }
}
```

Normalised positions are recommended so layouts can adapt across canvas sizes.

---

## 12. Technical architecture

ReelDock separates the interface from the native media engine. Capture, preview, recording, and export are native macOS work. The React interface never touches raw media: it renders controls and the layout editor, and reads or writes only metadata (device lists, project records, layout values, progress). There is no browser-based capture, no `getUserMedia`, and no WebView `<video>` in the product path.

```text
Tauri + React interface  (controls, layout, metadata only)
        │
        │ commands and events
        ▼
Rust application coordinator
        │
        │ C ABI, in-process (shares the app NSWindow)
        ▼
Swift capture module  (AVFoundation / CoreMediaIO)
```

The Swift capture module is compiled into the app binary and called over a C ABI from the Rust coordinator. It runs in-process so it can attach a native preview layer to the same `NSWindow` Tauri owns. It is not a separate process and not a WebView.

### 12.1 Tauri and React

Responsible for:

- Application interface
- Recording controls
- Device selection
- Project management
- Layout editor
- Export settings
- User preferences

### 12.2 Rust coordinator

Responsible for:

- Starting and stopping native helpers
- Managing project directories
- Tracking application state
- Forwarding device information
- Handling errors
- Starting export jobs
- Reporting progress to the interface

### 12.3 Swift capture module

Responsible for:

- iPhone discovery and capture
- Webcam capture
- Microphone capture
- Media timestamps
- Encoding
- Device-disconnection handling
- Native preview delivery
- Recording recovery

The iPhone screen is captured over USB as a CoreMediaIO screen-capture device, the same device QuickTime uses for "New Movie Recording." Those devices are hidden by default, so the module sets `kCMIOHardwarePropertyAllowScreenCaptureDevices` to `true` and then discovers the iPhone through `AVCaptureDeviceDiscoverySession`. The phone must be connected by cable, unlocked, and trusted; wireless capture is out of scope for the first release. The webcam and microphone are ordinary `AVCaptureDevice` inputs.

Each source is captured on its own `AVCaptureSession` input and written to its own file with native presentation timestamps, so the sources stay independent for editing. When the iPhone disconnects mid-recording, the module finalizes the files it has and reports the disconnection rather than corrupting the session.

Apple technologies:

- AVFoundation (`AVCaptureSession`, `AVCaptureDevice`, `AVCaptureMovieFileOutput` / `AVAssetWriter`)
- CoreMediaIO (USB iPhone screen-capture device discovery)
- CoreMedia (timestamps and sample buffers)
- VideoToolbox (H.264 encoding)
- Core Image or Metal (preview and composition rendering)

### 12.4 Preview delivery

Preview is a native `AVCaptureVideoPreviewLayer` (or a Metal-backed layer) hosted in an `NSView` layered over the Tauri window, positioned to match the on-screen canvas region. The React canvas leaves that region transparent and draws only the surrounding chrome, backgrounds, and overlays. The interface sends the canvas rectangle and layout to the native layer through commands whenever the layout changes; the native layer renders the live sources at that rectangle. Frame data never crosses the JavaScript bridge.

### 12.5 Export engine

Export composes the independently recorded tracks with AVFoundation's composition APIs:

- `AVMutableComposition` assembles the phone, webcam, and audio tracks on a shared timeline using their recorded timestamps
- `AVMutableVideoComposition` applies the layout transforms, corner-radius masks, camera shape, backgrounds, and device frame
- audio tracks are mixed with `AVMutableAudioMix`
- the result is written to an H.264 MP4 through `AVAssetExportSession` or `AVAssetWriter` at the selected canvas size

The final render must closely match the editor preview because both are driven by the same layout values. For the MVP, export remains local with no cloud rendering.

---

## 13. Preview strategy

The live preview and the recorded files are separate concerns.

During recording:

- Phone frames are written to the phone recording
- Webcam frames are written to the webcam recording
- Microphone samples are written to the audio recording
- The native preview layer shows the combined live view in the interface

The preview is the native `AVCaptureVideoPreviewLayer` described in section 12.4. It is not the final encoded output, and it is not produced in the WebView. Raw frames are never sent through the Tauri JavaScript command bridge, and `getUserMedia` / WebView `<video>` are not used anywhere in the product. This is deliberate: the iPhone screen is a CoreMediaIO device that WebKit does not reliably expose, and pushing frames through the bridge is too slow. The interface positions the native layer by sending only the canvas rectangle and layout values.

---

## 14. Error handling

ReelDock should provide understandable errors.

### Required error states

- No phone connected
- Phone not trusted
- Phone disconnected during recording
- Camera permission denied
- Microphone permission denied
- Selected webcam disconnected
- Selected microphone disconnected
- Insufficient disk space
- Recording file could not be created
- Export failed
- Unsupported phone capture source
- Capture session failed to start

### Recording recovery

The recording engine should write media in a way that reduces total data loss after a crash.

The MVP should attempt to recover completed media segments when:

- The application crashes
- The cable disconnects
- The capture helper stops unexpectedly

---

## 15. Non-functional requirements

### Performance

- Live preview should feel responsive
- Recording should not drop frames under normal supported conditions
- The editor should remain usable during playback
- Export should show progress

### Reliability

- A failed webcam should not automatically destroy the phone recording
- Each source should be written independently
- Device disconnection should produce a clear recovery state

### Privacy

- All recordings remain local by default
- ReelDock should not upload recordings without explicit user action
- Camera and microphone use must be visible and permission-based

### Usability

- The user should understand how to begin recording without documentation
- Technical setup messages should use plain language
- Device states should be visible before recording begins

---

## 16. MVP screens

### 16.1 Home

- New recording
- Recent projects
- Open existing project

### 16.2 Recording setup

- Connected phone
- Webcam selector
- Microphone selector
- Webcam toggle
- Layout preset
- Canvas ratio
- Live preview
- Record button

### 16.3 Recording screen

- Live composition preview
- Timer
- Audio meter
- Source status
- Stop button

### 16.4 Editor

- Preview canvas
- Simple trim control
- Layout panel
- Background panel
- Camera panel
- Phone panel
- Audio panel
- Export button

### 16.5 Export

- Aspect ratio
- Resolution
- Quality
- Destination
- Export progress
- Reveal in Finder

### 16.6 Preferences

- Default camera
- Default microphone
- Default aspect ratio
- Default export location
- Recording quality
- Hardware acceleration

---

## 17. Success criteria

The MVP is successful when the creator can use ReelDock to produce a real Elorah marketing video from start to finish.

### Technical success

- iPhone is detected reliably
- Phone video records correctly
- Webcam records correctly
- Microphone records correctly
- Sources stay synchronised
- Layout changes work after recording
- Export completes successfully
- Final output is suitable for publishing

### Product success

A user should be able to:

1. Connect an iPhone.
2. Start recording within two minutes.
3. Record an app walkthrough.
4. Adjust the composition without another editor.
5. Export a polished video.

### Internal validation target

Create at least ten real Elorah videos using ReelDock before expanding the product.

Track:

- Time from launch to recording
- Time from recording to export
- Number of failed recordings
- Number of exports requiring another editor
- Most-used layout
- Most-used aspect ratio
- Most-requested missing feature

---

## 18. Risks

### 18.1 iPhone capture compatibility

Connected iPhone discovery and capture behaviour may vary across macOS and iOS versions.

Mitigation:

- Prove the native capture path before building the editor
- Define a supported device and operating-system matrix
- Test physical devices early

### 18.2 Synchronisation drift

Independent sources may drift during longer recordings.

Mitigation:

- Use native media timestamps
- Use one project clock
- Test recordings of 10, 20, and 30 minutes
- Add correction during export if required

### 18.3 Tauri preview performance

Sending raw video frames through JavaScript may cause poor performance.

Mitigation:

- Keep media processing native
- Use a native helper
- Use efficient IPC or a native preview surface

### 18.4 Cable disconnection

A disconnected phone may interrupt the recording.

Mitigation:

- Record each source independently
- Save recoverable media
- Show immediate connection warnings

### 18.5 Dynamic Island content

Active system activities may appear in the captured status area.

Mitigation:

- Capture externally through the Mac
- Show a live pre-recording preview
- Ask the user to stop active Live Activities
- Offer a crop fallback

### 18.6 Scope expansion

Trying to compete immediately with professional video editors could delay the usable MVP.

Mitigation:

- Keep the first editor layout-focused
- Build only what is required to create real Elorah demos
- Add features after repeated internal use

---

## 19. Development phases

## Phase 0: Technical proof of concept

Goal: prove the difficult capture path.

Deliverables:

- Detect connected iPhone
- Display iPhone frames
- Record iPhone video
- Record webcam simultaneously
- Record microphone simultaneously
- Save source timestamps
- Verify synchronisation manually

Do not build the full Tauri editor before this works.

## Phase 1: Recording MVP

Deliverables:

- Tauri desktop shell
- Device selection
- Live preview
- Recording controls
- Project creation
- Phone, webcam, and microphone files
- Basic error handling

## Phase 2: Layout editor

Deliverables:

- Playback
- Source synchronisation
- Position and scale controls
- Webcam shapes
- Background colour
- Device frame
- Trim
- Aspect ratios

## Phase 3: Export

Deliverables:

- Local composition rendering
- H.264 MP4 export
- Export progress
- 16:9, 9:16, and 1:1 output

## Phase 4: Internal Elorah validation

Deliverables:

- Produce ten real Elorah videos
- Record workflow problems
- Fix reliability issues
- Identify the most valuable next features

## Phase 5: Public beta

Possible additions:

- Better templates
- Text overlays
- Captions
- Saved brand presets
- Additional device frames
- Android capture
- More export formats

---

## 20. Recommended first milestone

The first milestone should not be a polished application.

It should be a small native macOS prototype that can:

1. Detect an iPhone connected through USB.
2. Record the iPhone screen to a file.
3. Record the webcam to a separate file.
4. Record microphone audio to a separate file.
5. Store timing offsets.
6. Combine the files manually and confirm they remain synchronised.

Once this works, ReelDock has passed its largest technical risk.

---

## 21. Open questions

These should be answered during development rather than assumed.

- Which macOS versions will ReelDock support?
- Which iOS versions and iPhone models will be officially supported?
- Can phone audio be captured reliably through the selected iPhone capture path?
- How should the native preview be embedded into the Tauri interface?
- Should recording be stored as one long file or recoverable segments?
- Should the editor use HTML video playback or a fully native preview?
- Which device frames should ship with the MVP?
- Should users be able to save custom layout presets?
- Is pause and resume necessary for the first release?
- Is 4K export necessary, or is 1080p sufficient?
- Should Android be part of the first public beta or a later release?

---

## 22. Future opportunities

Possible future features include:

- Android recording through ADB and scrcpy
- Saved brand kits
- Animated backgrounds
- Automatic captions
- Scene switching
- Webcam background removal
- Camera colour correction
- Automatic silence removal
- Smart reframing across aspect ratios
- Text callouts
- Keyboard shortcut overlays
- App Store preview presets
- Product Hunt export presets
- Shared team templates
- Cloud backup
- Cloud rendering
- Browser and desktop-screen capture
- Webcam-only recording
- Remote iPhone capture
- Presenter notes or teleprompter

These should only be considered after the core mobile-demo workflow is reliable.

---

## 23. Product positioning

### One-line description

**ReelDock is a Mac app for recording polished mobile-app demos with your phone, webcam, and voice.**

### Clearer marketing description

**Connect your phone, record your app and camera together, adjust the layout, and export a polished product demo.**

### Possible tagline

**Record your app. Frame your story.**

---

## 24. Final MVP definition

ReelDock MVP is complete when a user can connect an iPhone to a Mac, record the phone, webcam, and microphone as separate synchronised sources, rearrange them in a simple editor, and export a polished MP4 without using another video editor.
