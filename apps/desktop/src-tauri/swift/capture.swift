import AVFoundation
import CoreMedia
import CoreMediaIO
import Foundation

private func enableScreenCaptureDevices() {
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

private func source(_ kind: String, _ device: AVCaptureDevice) -> [String: Any] {
  var result: [String: Any] = [
    "id": "\(kind):\(device.uniqueID)",
    "uniqueId": device.uniqueID,
    "label": device.localizedName,
    "kind": kind,
    "state": "available",
  ]
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

@_cdecl("reeldock_copy_capture_sources_json")
public func reeldock_copy_capture_sources_json() -> UnsafeMutablePointer<CChar>? {
  enableScreenCaptureDevices()

  var sources = videoSources()
  sources.append(contentsOf: microphoneSources())

  guard let data = try? JSONSerialization.data(withJSONObject: sources),
    let json = String(data: data, encoding: .utf8)
  else {
    return strdup("[]")
  }
  return strdup(json)
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

  guard let data = try? JSONSerialization.data(withJSONObject: devices),
    let json = String(data: data, encoding: .utf8)
  else {
    return strdup("[]")
  }
  return strdup(json)
}

@_cdecl("reeldock_free_string")
public func reeldock_free_string(_ pointer: UnsafeMutablePointer<CChar>?) {
  free(pointer)
}
