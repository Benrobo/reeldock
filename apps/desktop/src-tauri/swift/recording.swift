import AVFoundation
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

private final class NativeRecordingTrack: NSObject, AVCaptureFileOutputRecordingDelegate {
  // One track represents one separately saved source: phone, webcam, or microphone.
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

  func start(recordingStartedAt: Date) {
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

private final class NativeRecordingManager {
  static let shared = NativeRecordingManager()

  private var projectId: String?
  private var tracks: [NativeRecordingTrack] = []
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
    var prepared: [NativeRecordingTrack] = []
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

    let date = Date()
    startedAt = date
    for track in tracks {
      track.start(recordingStartedAt: date)
    }

    return NativeStartRecordingResult(
      startedAtHostTimeNs: String(UInt64(date.timeIntervalSince1970 * 1_000_000_000)),
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
    tracks.contains(where: { $0.output.isRecording })
  }

  private func stopSessions() {
    for track in tracks {
      if track.output.isRecording {
        track.output.stopRecording()
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
  ) throws -> NativeRecordingTrack {
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
