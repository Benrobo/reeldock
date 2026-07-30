import AVFoundation
import CoreMedia
import CoreMediaIO
import Foundation

private func enableScreenCaptureDevices() {
  // iPhone mirroring/capture can appear through CoreMediaIO screen capture devices.
  // This opt-in tells macOS to expose those external devices to AVFoundation discovery.
  // We call it before scans so plugged-in phones are visible as capture sources.
  var address = CMIOObjectPropertyAddress(
    mSelector: CMIOObjectPropertySelector(kCMIOHardwarePropertyAllowScreenCaptureDevices),
    mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
    mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain)
  )
  var allow: UInt32 = 1
  let size = UInt32(MemoryLayout<UInt32>.size)
  CMIOObjectSetPropertyData(
    CMIOObjectID(kCMIOObjectSystemObject), &address, 0, nil, size, &allow)
}

private func isPhone(_ device: AVCaptureDevice) -> Bool {
  let name = device.localizedName
  return name.range(of: "iphone", options: .caseInsensitive) != nil
    || name.range(of: "ipad", options: .caseInsensitive) != nil
}

private func phoneDevice() -> AVCaptureDevice? {
  let muxed = AVCaptureDevice.DiscoverySession(
    deviceTypes: [.external],
    mediaType: .muxed,
    position: .unspecified
  )
  if let device = muxed.devices.first {
    return device
  }
  if let device = AVCaptureDevice.default(for: .muxed) {
    return device
  }

  let external = AVCaptureDevice.DiscoverySession(
    deviceTypes: [.external],
    mediaType: nil,
    position: .unspecified
  )
  return external.devices.first(where: isPhone)
}

private func cameraDeviceTypes() -> [AVCaptureDevice.DeviceType] {
  var types: [AVCaptureDevice.DeviceType] = [.builtInWideAngleCamera, .external]
  if #unavailable(macOS 14.0) {
    types.append(.externalUnknown)
  }
  return types
}

private func webcamDevices(excluding phone: AVCaptureDevice?) -> [AVCaptureDevice] {
  let cameras = AVCaptureDevice.DiscoverySession(
    deviceTypes: cameraDeviceTypes(),
    mediaType: .video,
    position: .unspecified
  )
  return cameras.devices.filter { device in
    device.uniqueID != phone?.uniqueID && !isPhone(device)
  }
}

private func videoSources() -> [[String: Any]] {
  let phone = phoneDevice()
  let webcams = webcamDevices(excluding: phone)

  var sources: [[String: Any]] = []
  if let phone {
    sources.append(source("phone", phone))
  }
  for webcam in webcams {
    sources.append(source("webcam", webcam))
  }
  return sources
}

private func microphoneSources() -> [[String: Any]] {
  let microphones = AVCaptureDevice.DiscoverySession(
    deviceTypes: [.microphone],
    mediaType: .audio,
    position: .unspecified
  )

  let devices =
    microphones.devices.isEmpty
    ? AVCaptureDevice.default(for: .audio).map { [$0] } ?? []
    : microphones.devices

  return devices.map { source("microphone", $0) }
}

// This tracks microphone levels in real time and exposes them as JSON.
// It uses AVFoundation's AVCaptureAudioDataOutput to capture audio samples.
// The sample buffer delegate receives these in a background thread and updates levels.
// The UI can poll this JSON to display the current microphone level and activity.
private final class MicrophoneMeterManager: NSObject, AVCaptureAudioDataOutputSampleBufferDelegate {
  static let shared = MicrophoneMeterManager()

  private let queue = DispatchQueue(label: "reeldock.microphone-meter")
  private let lock = NSLock()
  private var session: AVCaptureSession?
  private var output: AVCaptureAudioDataOutput?
  private var uniqueId: String?
  private var level = 0.0
  private var peak = 0.0
  private var lastSampleAt: Date?

  func start(uniqueId requestedUniqueId: String) throws {
    if uniqueId == requestedUniqueId, session != nil {
      return
    }

    stop()

    guard let device = AVCaptureDevice(uniqueID: requestedUniqueId) else {
      throw NSError(domain: "ReelDockCapture", code: 20, userInfo: [
        NSLocalizedDescriptionKey: "Selected microphone is no longer available."
      ])
    }

    let nextSession = AVCaptureSession()
    nextSession.sessionPreset = .high
    let input = try AVCaptureDeviceInput(device: device)
    guard nextSession.canAddInput(input) else {
      throw NSError(domain: "ReelDockCapture", code: 21, userInfo: [
        NSLocalizedDescriptionKey: "Could not use selected microphone for input metering."
      ])
    }
    nextSession.addInput(input)

    let nextOutput = AVCaptureAudioDataOutput()
    guard nextSession.canAddOutput(nextOutput) else {
      throw NSError(domain: "ReelDockCapture", code: 22, userInfo: [
        NSLocalizedDescriptionKey: "Could not read selected microphone level."
      ])
    }
    nextSession.addOutput(nextOutput)
    nextOutput.setSampleBufferDelegate(self, queue: queue)

    lock.lock()
    session = nextSession
    output = nextOutput
    uniqueId = requestedUniqueId
    level = 0
    peak = 0
    lastSampleAt = nil
    lock.unlock()

    DispatchQueue.global(qos: .userInitiated).async {
      nextSession.startRunning()
    }
  }

  func stop() {
    lock.lock()
    let oldSession = session
    let oldOutput = output
    session = nil
    output = nil
    uniqueId = nil
    level = 0
    peak = 0
    lastSampleAt = nil
    lock.unlock()

    oldOutput?.setSampleBufferDelegate(nil, queue: nil)
    oldSession?.stopRunning()
  }

  func snapshot() -> [String: Any] {
    lock.lock()
    let seenRecently = lastSampleAt.map { Date().timeIntervalSince($0) < 1.0 } ?? false
    let result: [String: Any] = [
      "active": seenRecently,
      "level": seenRecently ? level : 0,
      "peak": seenRecently ? peak : 0,
      "uniqueId": uniqueId ?? NSNull(),
    ]
    lock.unlock()
    return result
  }

  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    let power = connection.audioChannels.map(\.averagePowerLevel).max() ?? -120
    let normalized = max(0, min(1, (Double(power) + 60) / 60))

    lock.lock()
    level = (level * 0.65) + (normalized * 0.35)
    peak = max(level, peak * 0.92)
    lastSampleAt = Date()
    lock.unlock()
  }
}

private func source(_ kind: String, _ device: AVCaptureDevice) -> [String: Any] {
  let defaultAudioDevice = kind == "microphone" ? AVCaptureDevice.default(for: .audio) : nil
  var result: [String: Any] = [
    "id": "\(kind):\(device.uniqueID)",
    "uniqueId": device.uniqueID,
    "label": device.localizedName,
    "kind": kind,
    "state": "available",
  ]
  if kind == "microphone", defaultAudioDevice?.uniqueID == device.uniqueID {
    result["isDefault"] = true
  }
  if device.hasMediaType(.audio) || device.hasMediaType(.muxed) {
    result["hasAudio"] = true
  }
  if device.hasMediaType(.video) || device.hasMediaType(.muxed) {
    let dimensions = CMVideoFormatDescriptionGetDimensions(device.activeFormat.formatDescription)
    if dimensions.width > 0 && dimensions.height > 0 {
      result["width"] = Int(dimensions.width)
      result["height"] = Int(dimensions.height)
    }
  }
  return result
}

private func copyJsonObject(_ object: Any, fallback: String) -> UnsafeMutablePointer<CChar>? {
  guard JSONSerialization.isValidJSONObject(object),
    let data = try? JSONSerialization.data(withJSONObject: object),
    let json = String(data: data, encoding: .utf8)
  else {
    return strdup(fallback)
  }
  return strdup(json)
}

@_cdecl("reeldock_copy_capture_sources_json")
public func reeldock_copy_capture_sources_json() -> UnsafeMutablePointer<CChar>? {
  // Rust cannot receive Swift arrays directly through the C boundary.
  // Serialize the sources to JSON and return a duplicated C string instead.
  // Rust is responsible for calling reeldock_free_string after reading this pointer.
  enableScreenCaptureDevices()

  var sources = videoSources()
  sources.append(contentsOf: microphoneSources())

  return copyJsonObject(sources, fallback: "[]")
}

@_cdecl("reeldock_prepare_capture")
public func reeldock_prepare_capture() {
  enableScreenCaptureDevices()
}

@_cdecl("reeldock_copy_all_devices_json")
public func reeldock_copy_all_devices_json() -> UnsafeMutablePointer<CChar>? {
  enableScreenCaptureDevices()

  let discovery = AVCaptureDevice.DiscoverySession(
    deviceTypes: cameraDeviceTypes() + [.microphone],
    mediaType: nil,
    position: .unspecified
  )

  let devices = discovery.devices.map { device -> [String: String] in
    return [
      "uniqueId": device.uniqueID,
      "label": device.localizedName,
      "deviceType": device.deviceType.rawValue,
      "video": device.hasMediaType(.video) ? "yes" : "no",
      "audio": device.hasMediaType(.audio) ? "yes" : "no",
      "muxed": device.hasMediaType(.muxed) ? "yes" : "no",
    ]
  }

  return copyJsonObject(devices, fallback: "[]")
}

@_cdecl("reeldock_start_microphone_meter_json")
public func reeldock_start_microphone_meter_json(
  _ uniqueIdPtr: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
  guard let uniqueIdPtr else {
    return copyJsonObject(["ok": false, "error": "Microphone id was missing."], fallback: "{}")
  }

  do {
    try MicrophoneMeterManager.shared.start(uniqueId: String(cString: uniqueIdPtr))
    return copyJsonObject(["ok": true], fallback: "{}")
  } catch {
    return copyJsonObject(["ok": false, "error": error.localizedDescription], fallback: "{}")
  }
}

@_cdecl("reeldock_stop_microphone_meter_json")
public func reeldock_stop_microphone_meter_json() -> UnsafeMutablePointer<CChar>? {
  MicrophoneMeterManager.shared.stop()
  return copyJsonObject(["ok": true], fallback: "{}")
}

@_cdecl("reeldock_copy_microphone_meter_json")
public func reeldock_copy_microphone_meter_json() -> UnsafeMutablePointer<CChar>? {
  return copyJsonObject(MicrophoneMeterManager.shared.snapshot(), fallback: "{}")
}

@_cdecl("reeldock_free_string")
public func reeldock_free_string(_ pointer: UnsafeMutablePointer<CChar>?) {
  // All JSON strings returned to Rust are created with strdup().
  // That means Rust must eventually hand the pointer back here for free().
  // Keeping this function shared avoids leaking every native JSON response.
  free(pointer)
}
