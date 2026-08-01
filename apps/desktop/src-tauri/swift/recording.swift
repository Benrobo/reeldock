import AVFoundation
import CoreMedia
import CoreVideo
import Foundation

private struct NativeRecordingSource: Codable {
  let kind: String
  let uniqueId: String
  let enabled: Bool
}

private struct NativeRecordingFile: Codable {
  let kind: String
  let path: String
}

private struct NativePrepareRecordingInput: Codable {
  let projectId: String
  let projectPath: String
  let sources: [NativeRecordingSource]
  let files: [NativeRecordingFile]
}

private struct NativeTrackResult: Codable {
  let kind: String
  let state: String
  let filePath: String?
  let startOffsetMs: Int
  let durationMs: Int
  let error: String?
}

private struct NativeStartRecordingResult: Codable {
  let startedAtHostTimeNs: String
  let tracks: [NativeTrackResult]
}

private struct NativeStopRecordingResult: Codable {
  let durationMs: Int
  let tracks: [NativeTrackResult]
}

private struct NativeOkResult: Codable {
  let ok: Bool
  let projectId: String
  let tracks: [NativeTrackResult]
}

private struct NativeErrorResult: Codable {
  let error: String
}

private protocol NativeRecordingTrackProtocol: AnyObject {
  var kind: String { get }
  var ownsSession: Bool { get }
  var session: AVCaptureSession { get }
  var isRecording: Bool { get }

  func start(recordingStartedAt: Date, hostStartTime: CMTime)
  func stop()
  func waitUntilFinished()
  func result() -> NativeTrackResult
  func normalizeDuration(to sessionDurationMs: Int)
  func cleanup()
}

private final class NativeRecordingTrack: NSObject, AVCaptureFileOutputRecordingDelegate,
  NativeRecordingTrackProtocol
{
  // One movie-output track represents one separately saved webcam or microphone source.
  // AVCapture writes asynchronously and reports completion through the delegate callback.
  // The manager reads this object later to update source_tracks with file path and duration.
  let kind: String
  let filePath: String
  let session: AVCaptureSession
  let output: AVCaptureMovieFileOutput
  let ownsSession: Bool
  let removesOutputOnCleanup: Bool
  private let finishedSemaphore = DispatchSemaphore(value: 0)
  private var lastState = "planned"
  private var lastError: String?
  private var startOffsetMs = 0
  private var durationMs = 0
  private var requestedStartAt: Date?

  var isRecording: Bool {
    output.isRecording
  }

  init(
    kind: String, filePath: String, session: AVCaptureSession, output: AVCaptureMovieFileOutput,
    ownsSession: Bool, removesOutputOnCleanup: Bool
  ) {
    self.kind = kind
    self.filePath = filePath
    self.session = session
    self.output = output
    self.ownsSession = ownsSession
    self.removesOutputOnCleanup = removesOutputOnCleanup
  }

  func start(recordingStartedAt: Date, hostStartTime: CMTime) {
    lastState = "recording"
    requestedStartAt = recordingStartedAt
    let url = URL(fileURLWithPath: filePath)
    output.startRecording(to: url, recordingDelegate: self)
  }

  func stop() {
    if output.isRecording {
      output.stopRecording()
    } else {
      finishedSemaphore.signal()
    }
  }

  func waitUntilFinished() {
    // stopRecording returns before AVFoundation has fully finalized the media file.
    // This wait gives the delegate time to report the final duration and success/failure.
    // Rust runs stop on a blocking worker thread so this wait does not freeze the app window.
    if finishedSemaphore.wait(timeout: .now() + 120) == .timedOut {
      lastState = "failed"
      lastError = "Timed out while finalizing \(kind) recording."
      cleanup()
    }
  }

  func result() -> NativeTrackResult {
    let path = lastState == "failed" ? nil : filePath
    return NativeTrackResult(
      kind: kind,
      state: lastState,
      filePath: path,
      startOffsetMs: startOffsetMs,
      durationMs: durationMs,
      error: lastError
    )
  }

  func normalizeDuration(to sessionDurationMs: Int) {
    if lastState == "recorded" && durationMs <= 0 {
      durationMs = max(1, sessionDurationMs - startOffsetMs)
    }
  }

  func fileOutput(
    _ output: AVCaptureFileOutput,
    didStartRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection]
  ) {
    if let requestedStartAt {
      startOffsetMs = max(0, Int(Date().timeIntervalSince(requestedStartAt) * 1000))
    }
  }

  func fileOutput(
    _ output: AVCaptureFileOutput,
    didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection],
    error: Error?
  ) {
    durationMs = max(0, Int(CMTimeGetSeconds(output.recordedDuration) * 1000))
    if let error {
      lastState = "failed"
      lastError = error.localizedDescription
    } else {
      lastState = "recorded"
      lastError = nil
    }
    cleanup()
    finishedSemaphore.signal()
  }

  func cleanup() {
    if ownsSession {
      session.stopRunning()
    } else if removesOutputOnCleanup && session.outputs.contains(output) {
      session.beginConfiguration()
      session.removeOutput(output)
      session.commitConfiguration()
    }
  }
}

private final class NativePhoneTimelineRecordingTrack: NSObject,
  AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate,
  NativeRecordingTrackProtocol
{
  let kind = "phone"
  let filePath: String
  let session: AVCaptureSession
  let ownsSession: Bool

  private let videoOutput = AVCaptureVideoDataOutput()
  private var audioOutput: AVCaptureAudioDataOutput?
  private let sampleQueue = DispatchQueue(label: "reeldock.phone-timeline.samples")
  private let writerQueue = DispatchQueue(label: "reeldock.phone-timeline.writer")
  private let finishedSemaphore = DispatchSemaphore(value: 0)
  private let frameRate: Int32 = 30
  private let preferredWidth: Int32
  private let preferredHeight: Int32
  private let lock = NSLock()

  private var lastState = "planned"
  private var lastError: String?
  private var durationMs = 0
  private var didAddVideoOutput = false
  private var didAddAudioOutput = false
  private var latestPixelBuffer: CVPixelBuffer?
  private var latestDimensions: CMVideoDimensions?
  private var assetWriter: AVAssetWriter?
  private var videoInput: AVAssetWriterInput?
  private var audioInput: AVAssetWriterInput?
  private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var frameTimer: DispatchSourceTimer?
  private var recordingStartHostTime = CMTime.zero
  private var nextFrameIndex: Int64 = 0
  private var acceptingSamples = false
  private var firstAudioSourceTime: CMTime?
  private var firstAudioTimelineTime: CMTime?

  var isRecording: Bool {
    writerQueue.sync { acceptingSamples }
  }

  init(filePath: String, session: AVCaptureSession, device: AVCaptureDevice, ownsSession: Bool)
    throws
  {
    self.filePath = filePath
    self.session = session
    self.ownsSession = ownsSession

    let dimensions = CMVideoFormatDescriptionGetDimensions(device.activeFormat.formatDescription)
    preferredWidth = max(1, dimensions.width)
    preferredHeight = max(1, dimensions.height)

    super.init()

    videoOutput.alwaysDiscardsLateVideoFrames = true
    videoOutput.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]

    session.beginConfiguration()
    guard session.canAddOutput(videoOutput) else {
      session.commitConfiguration()
      throw NSError(domain: "ReelDockRecording", code: 13, userInfo: [
        NSLocalizedDescriptionKey: "Could not read phone frames for timeline recording."
      ])
    }
    session.addOutput(videoOutput)
    didAddVideoOutput = true

    if device.hasMediaType(.audio) || device.hasMediaType(.muxed) {
      let nextAudioOutput = AVCaptureAudioDataOutput()
      guard session.canAddOutput(nextAudioOutput) else {
        if session.outputs.contains(videoOutput) {
          session.removeOutput(videoOutput)
          didAddVideoOutput = false
        }
        session.commitConfiguration()
        throw NSError(domain: "ReelDockRecording", code: 16, userInfo: [
          NSLocalizedDescriptionKey: "Could not read phone audio for timeline recording."
        ])
      }
      session.addOutput(nextAudioOutput)
      audioOutput = nextAudioOutput
      didAddAudioOutput = true
    }
    session.commitConfiguration()

    videoOutput.setSampleBufferDelegate(self, queue: sampleQueue)
    audioOutput?.setSampleBufferDelegate(self, queue: sampleQueue)
  }

  func start(recordingStartedAt: Date, hostStartTime: CMTime) {
    writerQueue.async {
      if self.acceptingSamples { return }
      do {
        try self.prepareWriter()
        self.recordingStartHostTime = hostStartTime
        self.nextFrameIndex = 0
        self.durationMs = 0
        self.lastState = "recording"
        self.lastError = nil
        self.acceptingSamples = true
        self.firstAudioSourceTime = nil
        self.firstAudioTimelineTime = nil
        self.startFrameTimer()
      } catch {
        self.lastState = "failed"
        self.lastError = error.localizedDescription
        self.cleanup()
        self.finishedSemaphore.signal()
      }
    }
  }

  func stop() {
    writerQueue.async {
      guard self.acceptingSamples else {
        if self.lastState == "planned" {
          self.lastState = "failed"
          self.lastError = "Phone recording was stopped before it started."
        }
        self.cleanup()
        self.finishedSemaphore.signal()
        return
      }

      let stopHostTime = self.currentHostTime()
      self.frameTimer?.cancel()
      self.frameTimer = nil
      self.writeDueFrames(until: stopHostTime)
      self.acceptingSamples = false
      self.durationMs = self.elapsedMilliseconds(until: stopHostTime)
      self.videoInput?.markAsFinished()
      self.audioInput?.markAsFinished()

      guard let assetWriter = self.assetWriter else {
        self.lastState = "failed"
        self.lastError = "Phone recording writer was not ready."
        self.cleanup()
        self.finishedSemaphore.signal()
        return
      }

      assetWriter.finishWriting {
        self.writerQueue.async {
          if assetWriter.status == .completed {
            self.lastState = "recorded"
            self.lastError = nil
          } else {
            self.lastState = "failed"
            self.lastError =
              assetWriter.error?.localizedDescription ?? "Phone recording could not be finalized."
          }
          self.cleanup()
          self.finishedSemaphore.signal()
        }
      }
    }
  }

  func waitUntilFinished() {
    if finishedSemaphore.wait(timeout: .now() + 120) == .timedOut {
      writerQueue.sync {
        lastState = "failed"
        lastError = "Timed out while finalizing phone recording."
        cleanup()
      }
    }
  }

  func result() -> NativeTrackResult {
    writerQueue.sync {
      NativeTrackResult(
        kind: kind,
        state: lastState,
        filePath: lastState == "failed" ? nil : filePath,
        startOffsetMs: 0,
        durationMs: durationMs,
        error: lastError
      )
    }
  }

  func normalizeDuration(to sessionDurationMs: Int) {
    writerQueue.sync {
      if lastState == "recorded" {
        durationMs = max(durationMs, sessionDurationMs)
      }
    }
  }

  func cleanup() {
    frameTimer?.cancel()
    frameTimer = nil
    videoOutput.setSampleBufferDelegate(nil, queue: nil)
    audioOutput?.setSampleBufferDelegate(nil, queue: nil)

    if ownsSession {
      session.stopRunning()
    }

    if didAddVideoOutput || didAddAudioOutput {
      session.beginConfiguration()
      if didAddVideoOutput && session.outputs.contains(videoOutput) {
        session.removeOutput(videoOutput)
      }
      if let audioOutput, didAddAudioOutput, session.outputs.contains(audioOutput) {
        session.removeOutput(audioOutput)
      }
      session.commitConfiguration()
    }

    didAddVideoOutput = false
    didAddAudioOutput = false
    assetWriter = nil
    videoInput = nil
    audioInput = nil
    pixelBufferAdaptor = nil
    acceptingSamples = false
  }

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    if output === videoOutput {
      storeVideoSample(sampleBuffer)
      return
    }

    if let audioOutput, output === audioOutput {
      appendAudioSample(sampleBuffer)
    }
  }

  private func storeVideoSample(_ sampleBuffer: CMSampleBuffer) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
      let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer)
    else { return }
    let dimensions = CMVideoFormatDescriptionGetDimensions(
      formatDescription)

    lock.lock()
    latestPixelBuffer = pixelBuffer
    latestDimensions = dimensions
    lock.unlock()
  }

  private func appendAudioSample(_ sampleBuffer: CMSampleBuffer) {
    writerQueue.async {
      guard self.acceptingSamples,
        let audioInput = self.audioInput,
        audioInput.isReadyForMoreMediaData
      else { return }

      let sourceTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
      if self.firstAudioSourceTime == nil {
        self.firstAudioSourceTime = sourceTime
        self.firstAudioTimelineTime = self.elapsedTime(until: self.currentHostTime())
      }

      guard let firstAudioSourceTime = self.firstAudioSourceTime,
        let firstAudioTimelineTime = self.firstAudioTimelineTime,
        let retimed = self.retimedAudioSample(
          sampleBuffer,
          sourceBase: firstAudioSourceTime,
          timelineBase: firstAudioTimelineTime
        )
      else { return }

      _ = audioInput.append(retimed)
    }
  }

  private func prepareWriter() throws {
    let size = writerSize()
    let url = URL(fileURLWithPath: filePath)
    let writer = try AVAssetWriter(outputURL: url, fileType: .mov)

    let bitrate = max(6_000_000, Int(size.width * size.height * 4))
    let videoInput = AVAssetWriterInput(
      mediaType: .video,
      outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: Int(size.width),
        AVVideoHeightKey: Int(size.height),
        AVVideoCompressionPropertiesKey: [
          AVVideoAverageBitRateKey: bitrate,
          AVVideoExpectedSourceFrameRateKey: Int(frameRate),
        ],
      ]
    )
    videoInput.expectsMediaDataInRealTime = true

    guard writer.canAdd(videoInput) else {
      throw NSError(domain: "ReelDockRecording", code: 14, userInfo: [
        NSLocalizedDescriptionKey: "Could not configure phone video writer."
      ])
    }
    writer.add(videoInput)

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: videoInput,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: Int(size.width),
        kCVPixelBufferHeightKey as String: Int(size.height),
      ]
    )

    var nextAudioInput: AVAssetWriterInput?
    if audioOutput != nil {
      let input = AVAssetWriterInput(
        mediaType: .audio,
        outputSettings: [
          AVFormatIDKey: kAudioFormatMPEG4AAC,
          AVNumberOfChannelsKey: 2,
          AVSampleRateKey: 48_000,
          AVEncoderBitRateKey: 128_000,
        ]
      )
      input.expectsMediaDataInRealTime = true
      guard writer.canAdd(input) else {
        throw NSError(domain: "ReelDockRecording", code: 17, userInfo: [
          NSLocalizedDescriptionKey: "Could not configure phone audio writer."
        ])
      }
      writer.add(input)
      nextAudioInput = input
    }

    guard writer.startWriting() else {
      throw NSError(domain: "ReelDockRecording", code: 15, userInfo: [
        NSLocalizedDescriptionKey: writer.error?.localizedDescription ?? "Could not start phone writer."
      ])
    }
    writer.startSession(atSourceTime: .zero)

    assetWriter = writer
    self.videoInput = videoInput
    audioInput = nextAudioInput
    pixelBufferAdaptor = adaptor
  }

  private func startFrameTimer() {
    let timer = DispatchSource.makeTimerSource(queue: writerQueue)
    timer.schedule(deadline: .now(), repeating: .milliseconds(Int(1000 / frameRate)), leeway: .milliseconds(4))
    timer.setEventHandler { [weak self] in
      guard let self else { return }
      self.writeDueFrames(until: self.currentHostTime())
    }
    frameTimer = timer
    timer.resume()
  }

  private func writeDueFrames(until hostTime: CMTime) {
    guard acceptingSamples,
      let videoInput,
      let pixelBufferAdaptor,
      videoInput.isReadyForMoreMediaData
    else { return }

    let elapsed = elapsedTime(until: hostTime)
    let seconds = max(0, CMTimeGetSeconds(elapsed))
    let targetFrameIndex = Int64((seconds * Double(frameRate)).rounded(.down))

    while nextFrameIndex <= targetFrameIndex {
      autoreleasepool {
        let presentationTime = CMTime(value: nextFrameIndex, timescale: frameRate)
        if let pixelBuffer = framePixelBuffer() {
          if !pixelBufferAdaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
            lastState = "failed"
            lastError =
              assetWriter?.error?.localizedDescription ?? "Could not append phone video frame."
            acceptingSamples = false
          }
        }
        nextFrameIndex += 1
      }
      if !acceptingSamples { break }
    }
  }

  private func framePixelBuffer() -> CVPixelBuffer? {
    lock.lock()
    let pixelBuffer = latestPixelBuffer
    lock.unlock()
    if let pixelBuffer {
      return pixelBuffer
    }
    return blackPixelBuffer()
  }

  private func blackPixelBuffer() -> CVPixelBuffer? {
    guard let pool = pixelBufferAdaptor?.pixelBufferPool else { return nil }
    var pixelBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer) == kCVReturnSuccess,
      let pixelBuffer
    else {
      return nil
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    if let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) {
      memset(baseAddress, 0, CVPixelBufferGetDataSize(pixelBuffer))
    }
    CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
    return pixelBuffer
  }

  private func writerSize() -> CMVideoDimensions {
    lock.lock()
    let dimensions = latestDimensions
    let pixelBuffer = latestPixelBuffer
    lock.unlock()

    if let pixelBuffer {
      return CMVideoDimensions(
        width: Int32(CVPixelBufferGetWidth(pixelBuffer)),
        height: Int32(CVPixelBufferGetHeight(pixelBuffer))
      )
    }

    if let dimensions, dimensions.width > 0, dimensions.height > 0 {
      return dimensions
    }

    return CMVideoDimensions(width: preferredWidth, height: preferredHeight)
  }

  private func retimedAudioSample(
    _ sampleBuffer: CMSampleBuffer,
    sourceBase: CMTime,
    timelineBase: CMTime
  ) -> CMSampleBuffer? {
    var entriesNeeded = 0
    let countStatus = CMSampleBufferGetSampleTimingInfoArray(
      sampleBuffer,
      entryCount: 0,
      arrayToFill: nil,
      entriesNeededOut: &entriesNeeded
    )
    guard countStatus == noErr, entriesNeeded > 0 else { return sampleBuffer }

    var timing = Array(
      repeating: CMSampleTimingInfo(
        duration: .invalid,
        presentationTimeStamp: .invalid,
        decodeTimeStamp: .invalid
      ),
      count: entriesNeeded
    )
    let timingStatus = CMSampleBufferGetSampleTimingInfoArray(
      sampleBuffer,
      entryCount: entriesNeeded,
      arrayToFill: &timing,
      entriesNeededOut: &entriesNeeded
    )
    guard timingStatus == noErr else { return nil }

    for index in timing.indices {
      let relativePresentation = CMTimeSubtract(timing[index].presentationTimeStamp, sourceBase)
      timing[index].presentationTimeStamp = maxTime(.zero, CMTimeAdd(timelineBase, relativePresentation))
      if timing[index].decodeTimeStamp.isValid {
        let relativeDecode = CMTimeSubtract(timing[index].decodeTimeStamp, sourceBase)
        timing[index].decodeTimeStamp = maxTime(.zero, CMTimeAdd(timelineBase, relativeDecode))
      }
    }

    var copy: CMSampleBuffer?
    let copyStatus = CMSampleBufferCreateCopyWithNewTiming(
      allocator: kCFAllocatorDefault,
      sampleBuffer: sampleBuffer,
      sampleTimingEntryCount: timing.count,
      sampleTimingArray: &timing,
      sampleBufferOut: &copy
    )
    guard copyStatus == noErr else { return nil }
    return copy
  }

  private func currentHostTime() -> CMTime {
    CMClockGetTime(CMClockGetHostTimeClock())
  }

  private func elapsedTime(until hostTime: CMTime) -> CMTime {
    maxTime(.zero, CMTimeSubtract(hostTime, recordingStartHostTime))
  }

  private func elapsedMilliseconds(until hostTime: CMTime) -> Int {
    max(0, Int(CMTimeGetSeconds(elapsedTime(until: hostTime)) * 1000))
  }

  private func maxTime(_ left: CMTime, _ right: CMTime) -> CMTime {
    CMTimeCompare(left, right) >= 0 ? left : right
  }
}

private func currentHostTime() -> CMTime {
  CMClockGetTime(CMClockGetHostTimeClock())
}

private func hostTimeNanoseconds(_ time: CMTime) -> String {
  let seconds = CMTimeGetSeconds(time)
  guard seconds.isFinite && seconds > 0 else { return "0" }
  return String(UInt64(seconds * 1_000_000_000))
}

private final class NativeRecordingManager {
  static let shared = NativeRecordingManager()

  private var projectId: String?
  private var tracks: [NativeRecordingTrackProtocol] = []
  private var startedAt: Date?
  // When webcam and microphone are both enabled, the selected mic is recorded into webcam.mov.
  // We still return a microphone source row, but it points at the same file so the editor has one
  // media clock for mouth movement and voice.
  private var microphoneMetadataMirrorsWebcam = false

  func prepare(_ input: NativePrepareRecordingInput) throws -> NativeOkResult {
    if isRecording {
      throw NSError(domain: "ReelDockRecording", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "A recording is already running."
      ])
    }

    stopSessions()
    try FileManager.default.createDirectory(
      atPath: input.projectPath, withIntermediateDirectories: true)

    let linkedMicrophoneUniqueId = webcamLinkedMicrophoneUniqueId(input)
    var prepared: [NativeRecordingTrackProtocol] = []
    for source in input.sources where source.enabled {
      guard shouldRecordSource(source, linkedMicrophoneUniqueId: linkedMicrophoneUniqueId) else { continue }
      guard let file = input.files.first(where: { $0.kind == source.kind }) else {
        throw NSError(domain: "ReelDockRecording", code: 2, userInfo: [
          NSLocalizedDescriptionKey: "Missing output file for \(source.kind)."
        ])
      }
      let audioUniqueId = linkedAudioUniqueId(for: source, linkedMicrophoneUniqueId: linkedMicrophoneUniqueId)
      prepared.append(try makeTrack(source: source, file: file, audioUniqueId: audioUniqueId))
    }

    guard prepared.contains(where: { $0.kind == "phone" }) else {
      throw NSError(domain: "ReelDockRecording", code: 3, userInfo: [
        NSLocalizedDescriptionKey: "Phone recording requires a connected iPhone source."
      ])
    }

    projectId = input.projectId
    tracks = prepared
    microphoneMetadataMirrorsWebcam = linkedMicrophoneUniqueId != nil

    return NativeOkResult(
      ok: true,
      projectId: input.projectId,
      tracks: resultTracks()
    )
  }

  func start(projectId requestedProjectId: String) throws -> NativeStartRecordingResult {
    guard requestedProjectId == projectId else {
      throw NSError(domain: "ReelDockRecording", code: 4, userInfo: [
        NSLocalizedDescriptionKey: "Recording project is not prepared."
      ])
    }
    guard !tracks.isEmpty else {
      throw NSError(domain: "ReelDockRecording", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "No recording tracks are prepared."
      ])
    }

    for track in tracks {
      if track.ownsSession {
        track.session.startRunning()
      }
    }

    let hostStartTime = currentHostTime()
    let date = Date()
    startedAt = date
    for track in tracks {
      track.start(recordingStartedAt: date, hostStartTime: hostStartTime)
    }

    return NativeStartRecordingResult(
      startedAtHostTimeNs: hostTimeNanoseconds(hostStartTime),
      tracks: resultTracks()
    )
  }

  func stop(projectId requestedProjectId: String) throws -> NativeStopRecordingResult {
    // Stop every active output first, then wait for each delegate to finish writing.
    // Files may exist before this returns, but duration/state are only reliable after callbacks.
    // The returned JSON is what the frontend uses to update project metadata and navigate.
    guard requestedProjectId == projectId else {
      throw NSError(domain: "ReelDockRecording", code: 6, userInfo: [
        NSLocalizedDescriptionKey: "Recording project is not active."
      ])
    }

    let start = startedAt ?? Date()
    for track in tracks {
      track.stop()
    }
    for track in tracks {
      track.waitUntilFinished()
    }

    let duration = max(0, Int(Date().timeIntervalSince(start) * 1000))
    for track in tracks {
      track.normalizeDuration(to: duration)
    }
    let resultTracks = resultTracks()
    stopSessions()

    return NativeStopRecordingResult(durationMs: duration, tracks: resultTracks)
  }

  private func resultTracks() -> [NativeTrackResult] {
    var results = tracks.map { $0.result() }
    // The database still needs a microphone source because the editor has microphone controls.
    // For webcam+mic sessions that source is metadata only; webcam.mov carries the actual audio.
    guard microphoneMetadataMirrorsWebcam,
      !results.contains(where: { $0.kind == "microphone" }),
      let webcam = results.first(where: { $0.kind == "webcam" })
    else { return results }

    results.append(
      NativeTrackResult(
        kind: "microphone",
        state: webcam.state,
        filePath: webcam.filePath,
        startOffsetMs: webcam.startOffsetMs,
        durationMs: webcam.durationMs,
        error: webcam.error
      )
    )
    return results
  }

  private func webcamLinkedMicrophoneUniqueId(_ input: NativePrepareRecordingInput) -> String? {
    // This is the deliberate lip-sync path: webcam video and selected mic audio are written by
    // the same AVCaptureMovieFileOutput instead of trying to sync separate files later.
    guard input.sources.contains(where: { $0.enabled && $0.kind == "webcam" }) else {
      return nil
    }
    return input.sources.first { $0.enabled && $0.kind == "microphone" }?.uniqueId
  }

  private func shouldRecordSource(
    _ source: NativeRecordingSource,
    linkedMicrophoneUniqueId: String?
  ) -> Bool {
    if source.kind == "phone-audio" {
      return false
    }
    if source.kind == "microphone" && linkedMicrophoneUniqueId != nil {
      return false
    }
    return true
  }

  private func linkedAudioUniqueId(
    for source: NativeRecordingSource,
    linkedMicrophoneUniqueId: String?
  ) -> String? {
    source.kind == "webcam" ? linkedMicrophoneUniqueId : nil
  }

  private var isRecording: Bool {
    tracks.contains(where: { $0.isRecording })
  }

  private func stopSessions() {
    for track in tracks {
      if track.isRecording {
        track.stop()
      }
      track.cleanup()
    }
    tracks = []
    projectId = nil
    startedAt = nil
    microphoneMetadataMirrorsWebcam = false
  }

  private func makeTrack(
    source: NativeRecordingSource, file: NativeRecordingFile, audioUniqueId: String? = nil
  ) throws -> NativeRecordingTrackProtocol {
    let fileURL = URL(fileURLWithPath: file.path)
    try FileManager.default.createDirectory(
      at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    if FileManager.default.fileExists(atPath: file.path) {
      try FileManager.default.removeItem(atPath: file.path)
    }

    guard let device = AVCaptureDevice(uniqueID: source.uniqueId) else {
      throw NSError(domain: "ReelDockRecording", code: 7, userInfo: [
        NSLocalizedDescriptionKey: "\(source.kind) source is no longer available."
      ])
    }

    if source.kind == "phone" {
      if let previewSession = PreviewManager.shared.recordingSession(
        id: source.kind, uniqueId: source.uniqueId)
      {
        return try NativePhoneTimelineRecordingTrack(
          filePath: file.path, session: previewSession, device: device, ownsSession: false)
      }

      let session = try makeStandaloneSession(device: device, kind: source.kind)
      return try NativePhoneTimelineRecordingTrack(
        filePath: file.path, session: session, device: device, ownsSession: true)
    }

    if source.kind == "microphone" {
      let session = try makeStandaloneSession(device: device, kind: source.kind)
      let output = AVCaptureMovieFileOutput()
      output.movieFragmentInterval = CMTime(seconds: 2, preferredTimescale: 600)
      guard session.canAddOutput(output) else {
        throw NSError(domain: "ReelDockRecording", code: 9, userInfo: [
          NSLocalizedDescriptionKey: "Could not write microphone audio."
        ])
      }
      session.addOutput(output)
      return NativeRecordingTrack(
        kind: source.kind, filePath: file.path, session: session, output: output,
        ownsSession: true, removesOutputOnCleanup: true)
    }

    if let previewOutput = PreviewManager.shared.recordingMovieOutput(
      id: source.kind, uniqueId: source.uniqueId, audioUniqueId: audioUniqueId)
    {
      return NativeRecordingTrack(
        kind: source.kind, filePath: file.path, session: previewOutput.session,
        output: previewOutput.output, ownsSession: false, removesOutputOnCleanup: false)
    }

    let session = try makeStandaloneSession(device: device, kind: source.kind)
    if let audioUniqueId {
      try addAudioInput(uniqueId: audioUniqueId, to: session)
    }
    let output = AVCaptureMovieFileOutput()
    output.movieFragmentInterval = CMTime(seconds: 2, preferredTimescale: 600)
    session.beginConfiguration()
    guard session.canAddOutput(output) else {
      session.commitConfiguration()
      throw NSError(domain: "ReelDockRecording", code: 10, userInfo: [
        NSLocalizedDescriptionKey: "Could not write \(source.kind) video."
      ])
    }
    session.addOutput(output)
    session.commitConfiguration()
    return NativeRecordingTrack(
      kind: source.kind, filePath: file.path, session: session, output: output,
      ownsSession: true, removesOutputOnCleanup: true)
  }

  private func addAudioInput(uniqueId: String, to session: AVCaptureSession) throws {
    guard let device = AVCaptureDevice(uniqueID: uniqueId) else {
      throw NSError(domain: "ReelDockRecording", code: 11, userInfo: [
        NSLocalizedDescriptionKey: "Selected microphone is no longer available."
      ])
    }
    let input = try AVCaptureDeviceInput(device: device)
    guard session.canAddInput(input) else {
      throw NSError(domain: "ReelDockRecording", code: 12, userInfo: [
        NSLocalizedDescriptionKey: "Could not attach microphone to webcam recording."
      ])
    }
    session.addInput(input)
  }

  private func makeStandaloneSession(device: AVCaptureDevice, kind: String) throws -> AVCaptureSession {
    let session = AVCaptureSession()
    session.sessionPreset = .high
    let input = try AVCaptureDeviceInput(device: device)
    guard session.canAddInput(input) else {
      throw NSError(domain: "ReelDockRecording", code: 8, userInfo: [
        NSLocalizedDescriptionKey: "Could not use \(kind) as a recording input."
      ])
    }
    session.addInput(input)
    return session
  }
}

private func recordingJson<T: Encodable>(_ value: T) -> UnsafeMutablePointer<CChar>? {
  guard let data = try? JSONEncoder().encode(value),
    let json = String(data: data, encoding: .utf8)
  else {
    return strdup("{\"error\":\"Could not encode native recording response.\"}")
  }
  return strdup(json)
}

private func recordingErrorJson(_ error: Error) -> UnsafeMutablePointer<CChar>? {
  recordingJson(NativeErrorResult(error: error.localizedDescription))
}

@_cdecl("reeldock_prepare_recording_json")
public func reeldock_prepare_recording_json(
  _ inputJson: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
  guard let inputJson else {
    return recordingJson(NativeErrorResult(error: "Recording input was missing."))
  }

  do {
    let data = Data(String(cString: inputJson).utf8)
    let input = try JSONDecoder().decode(NativePrepareRecordingInput.self, from: data)
    return recordingJson(try NativeRecordingManager.shared.prepare(input))
  } catch {
    return recordingErrorJson(error)
  }
}

@_cdecl("reeldock_start_recording_json")
public func reeldock_start_recording_json(
  _ projectId: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
  guard let projectId else {
    return recordingJson(NativeErrorResult(error: "Recording project id was missing."))
  }

  do {
    return recordingJson(
      try NativeRecordingManager.shared.start(projectId: String(cString: projectId)))
  } catch {
    return recordingErrorJson(error)
  }
}

@_cdecl("reeldock_stop_recording_json")
public func reeldock_stop_recording_json(
  _ projectId: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
  guard let projectId else {
    return recordingJson(NativeErrorResult(error: "Recording project id was missing."))
  }

  do {
    return recordingJson(
      try NativeRecordingManager.shared.stop(projectId: String(cString: projectId)))
  } catch {
    return recordingErrorJson(error)
  }
}
