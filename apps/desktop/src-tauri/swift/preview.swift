import AVFoundation
import AppKit

private let previewDebug = false
private let phonePreviewYOffset: CGFloat = 0
private let webcamPreviewYOffset: CGFloat = 0

private final class PreviewSurface {
  let session: AVCaptureSession
  let overlay: NSView
  let previewLayer: AVCaptureVideoPreviewLayer
  var audioPreviewOutput: AVCaptureAudioPreviewOutput?
  var movieOutput: AVCaptureMovieFileOutput?

  init(session: AVCaptureSession, overlay: NSView, previewLayer: AVCaptureVideoPreviewLayer) {
    self.session = session
    self.overlay = overlay
    self.previewLayer = previewLayer
  }
}

private final class PreviewOverlayView: NSView {
  override func hitTest(_ point: NSPoint) -> NSView? {
    return nil
  }
}

private final class PreviewHostView: NSView {
  override var isFlipped: Bool {
    return true
  }

  override func hitTest(_ point: NSPoint) -> NSView? {
    return nil
  }
}

// This draws a black background with a semi-transparent countdown number.
// It's layered above the preview surface and animated when recording starts.
private final class CountdownOverlayView: NSView {
  var value: String {
    didSet {
      needsDisplay = true
    }
  }

  init(value: String, frame: NSRect) {
    self.value = value
    super.init(frame: frame)
    wantsLayer = true
    layer?.backgroundColor = NSColor.clear.cgColor
    layer?.zPosition = 10_000
    autoresizingMask = [.width, .height]
  }

  required init?(coder: NSCoder) {
    return nil
  }

  override var isFlipped: Bool {
    return true
  }

  override func hitTest(_ point: NSPoint) -> NSView? {
    return nil
  }

  override func draw(_ dirtyRect: NSRect) {
    NSColor.black.withAlphaComponent(0.36).setFill()
    bounds.fill()

    let shadow = NSShadow()
    shadow.shadowBlurRadius = 28
    shadow.shadowOffset = NSSize(width: 0, height: -12)
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.6)
    let attributes: [NSAttributedString.Key: Any] = [
      .font: NSFont.monospacedDigitSystemFont(ofSize: 132, weight: .semibold),
      .foregroundColor: NSColor(calibratedRed: 1.0, green: 0.87, blue: 0.84, alpha: 1.0),
      .shadow: shadow,
    ]
    let text = NSAttributedString(string: value, attributes: attributes)
    let size = text.size()
    let rect = NSRect(
      x: (bounds.width - size.width) / 2,
      y: (bounds.height - size.height) / 2,
      width: size.width,
      height: size.height
    )
    text.draw(in: rect)
  }
}

final class PreviewManager {
  static let shared = PreviewManager()

  private var surfaces: [String: PreviewSurface] = [:]

  func start(
    id: String, host: NSView, uniqueId: String, rect: NSRect, radius: CGFloat, mirror: Bool
  ) -> Bool {
    stop(id: id)

    guard let device = AVCaptureDevice(uniqueID: uniqueId),
      let input = try? AVCaptureDeviceInput(device: device)
    else {
      return false
    }

    let session = AVCaptureSession()
    session.sessionPreset = .high
    guard session.canAddInput(input) else { return false }
    session.addInput(input)

    let overlay = PreviewOverlayView(frame: rect)
    overlay.wantsLayer = true
    overlay.layer?.backgroundColor = NSColor.black.cgColor
    overlay.layer?.cornerRadius = radius
    overlay.layer?.masksToBounds = true
    overlay.layer?.borderColor = id == "phone" ? NSColor.black.cgColor : NSColor.clear.cgColor
    overlay.layer?.borderWidth = id == "phone" ? bezelWidth(rect) : 0
    if previewDebug {
      overlay.layer?.borderColor = id == "phone" ? NSColor.systemRed.cgColor : NSColor.systemGreen.cgColor
      overlay.layer?.borderWidth = 4
    }

    let previewLayer = AVCaptureVideoPreviewLayer(session: session)
    previewLayer.videoGravity = id == "phone" ? .resizeAspect : .resizeAspectFill
    previewLayer.frame = overlay.bounds
    previewLayer.cornerRadius = radius
    previewLayer.masksToBounds = true
    if let connection = previewLayer.connection, connection.isVideoMirroringSupported {
      connection.automaticallyAdjustsVideoMirroring = false
      connection.isVideoMirrored = mirror
    }
    overlay.layer?.addSublayer(previewLayer)

    let surface = PreviewSurface(session: session, overlay: overlay, previewLayer: previewLayer)
    installMovieRecorderOutput(surface)
    if id == "phone" {
      installMutedAudioMonitor(surface)
    }

    host.addSubview(overlay)
    surfaces[id] = surface

    DispatchQueue.global(qos: .userInitiated).async {
      session.startRunning()
    }
    return true
  }

  func setFrame(id: String, rect: NSRect, radius: CGFloat) {
    guard let surface = surfaces[id] else { return }
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    surface.overlay.frame = rect
    surface.overlay.layer?.cornerRadius = radius
    surface.overlay.layer?.borderWidth = id == "phone" ? bezelWidth(rect) : 0
    if previewDebug {
      surface.overlay.layer?.borderWidth = 4
    }
    surface.previewLayer.frame = surface.overlay.bounds
    surface.previewLayer.cornerRadius = radius
    CATransaction.commit()
  }

  func stop(id: String) {
    stopAudioMonitor(id: id)
    guard let surface = surfaces.removeValue(forKey: id) else { return }
    surface.session.stopRunning()
    surface.overlay.removeFromSuperview()
  }

  private func installMutedAudioMonitor(_ surface: PreviewSurface) {
    // Add the phone audio preview output once while the capture session is being built.
    // Later Sound toggles only change volume, avoiding session reconfiguration flashes.
    // A muted output is silent, but ready for instant monitoring when the user turns Sound on.
    // This is intentional: add/remove output calls can make AVCaptureVideoPreviewLayer go dark briefly.
    let output = AVCaptureAudioPreviewOutput()
    output.volume = 0
    guard surface.session.canAddOutput(output) else { return }
    surface.session.addOutput(output)
    surface.audioPreviewOutput = output
  }

  private func installMovieRecorderOutput(_ surface: PreviewSurface) {
    // Attach the file output while the preview session is first built, before it starts running.
    // Adding this output later during Record reconfigures the live session and can blank preview video.
    // Recording can then start writing to a URL without changing the session graph.
    let output = AVCaptureMovieFileOutput()
    output.movieFragmentInterval = CMTime(seconds: 2, preferredTimescale: 600)
    guard surface.session.canAddOutput(output) else { return }
    surface.session.addOutput(output)
    surface.movieOutput = output
  }

  private func hasDevice(_ surface: PreviewSurface, uniqueId: String) -> Bool {
    return surface.session.inputs.contains { input in
      guard let deviceInput = input as? AVCaptureDeviceInput else { return false }
      return deviceInput.device.uniqueID == uniqueId
    }
  }

  func startAudioMonitor(id: String, uniqueId: String, volume: Float) -> Bool {
    // This monitors captured phone audio live through the Mac output device.
    // It does not write media; phone audio is still recorded inside phone.mov by the file output.
    // Keeping monitor output separate lets users hear demos without changing source files.
    guard let surface = surfaces[id] else { return false }
    guard hasDevice(surface, uniqueId: uniqueId) else { return false }

    if let existing = surface.audioPreviewOutput {
      existing.volume = volume
      return true
    }

    installMutedAudioMonitor(surface)
    guard let output = surface.audioPreviewOutput else { return false }
    output.volume = volume
    return true
  }

  func stopAudioMonitor(id: String) {
    // Muting stops live speaker playback without changing capture-session outputs.
    // Removing outputs while video preview is running can briefly blank the phone preview.
    // Keeping the muted output attached makes Sound toggles visually stable.
    // The output is released naturally when the whole preview session stops.
    guard let surface = surfaces[id], let output = surface.audioPreviewOutput else { return }
    output.volume = 0
  }

  func recordingMovieOutput(id: String, uniqueId: String) -> (
    session: AVCaptureSession, output: AVCaptureMovieFileOutput
  )? {
    // Recording should reuse the preview's already-attached movie output.
    // That keeps the native session topology stable when the user presses Record.
    // If this returns nil, recording falls back to a standalone capture session.
    guard let surface = surfaces[id], hasDevice(surface, uniqueId: uniqueId) else { return nil }
    guard let output = surface.movieOutput else { return nil }
    return (surface.session, output)
  }
}

private func bezelWidth(_ rect: NSRect) -> CGFloat {
  return max(4, min(rect.width, rect.height) * 0.012)
}

private func findWebView(_ view: NSView) -> NSView? {
  if String(describing: type(of: view)).contains("WebView") {
    return view
  }
  for subview in view.subviews {
    if let found = findWebView(subview) {
      return found
    }
  }
  return nil
}

private let previewHostIdentifier = NSUserInterfaceItemIdentifier("reeldock.preview.host")
private let countdownOverlayIdentifier = NSUserInterfaceItemIdentifier("reeldock.preview.countdown")

private func previewAnchor(_ window: NSWindow) -> NSView? {
  guard let content = window.contentView else { return nil }
  return findWebView(content) ?? content
}

private func countdownAnchor(_ window: NSWindow) -> NSView? {
  return window.contentView
}

private func previewHost(_ window: NSWindow) -> NSView? {
  // Native previews are AppKit views layered above the Tauri webview.
  // We create one transparent host per window and reuse it for phone/webcam surfaces.
  // React sends CSS rectangles; this host gives Swift a stable native coordinate space.
  guard let anchor = previewAnchor(window) else { return nil }

  if let existing = anchor.subviews.first(where: { $0.identifier == previewHostIdentifier }) {
    return existing
  }

  let host = PreviewHostView(frame: anchor.bounds)
  host.identifier = previewHostIdentifier
  host.autoresizingMask = [.width, .height]
  host.wantsLayer = true
  anchor.addSubview(host)
  return host
}

private func setCountdownOverlay(_ window: NSWindow, value: String?) {
  guard let anchor = countdownAnchor(window) else { return }
  let existing = anchor.subviews.first(where: { $0.identifier == countdownOverlayIdentifier })
    as? CountdownOverlayView

  guard let value, !value.isEmpty else {
    existing?.removeFromSuperview()
    return
  }

  if let existing {
    existing.value = value
    existing.frame = anchor.bounds
    existing.needsDisplay = true
    return
  }

  let overlay = CountdownOverlayView(value: value, frame: anchor.bounds)
  overlay.identifier = countdownOverlayIdentifier
  anchor.addSubview(overlay, positioned: .above, relativeTo: nil)
}

private func frameInView(_ view: NSView, _ x: Double, _ y: Double, _ w: Double, _ h: Double)
  -> NSRect
{
  if view.isFlipped {
    return NSRect(x: x, y: y, width: w, height: h)
  }
  return NSRect(x: x, y: view.bounds.height - y - h, width: w, height: h)
}

private func previewSurfaceYOffset(_ id: String) -> CGFloat {
  return id == "webcam" ? webcamPreviewYOffset : phonePreviewYOffset
}

private func previewSurfaceFrameInHost(
  id: String, host: NSView, _ x: Double, _ y: Double, _ w: Double, _ h: Double
) -> NSRect {
  let frame = frameInView(host, x, y, w, h)
  return frame.offsetBy(dx: 0, dy: previewSurfaceYOffset(id))
}

private func updatePreviewHost(
  _ host: NSView, hostX: Double, hostY: Double, hostW: Double, hostH: Double
) {
  guard let superview = host.superview else { return }
  if hostW > 0 && hostH > 0 {
    host.frame = frameInView(superview, hostX, hostY, hostW, hostH)
    host.autoresizingMask = []
  } else {
    host.frame = superview.bounds
    host.autoresizingMask = [.width, .height]
  }
}

private func previewLog(_ message: String) {
  guard previewDebug else { return }
  let path = "/tmp/reeldock-preview.log"
  let line = message + "\n"
  guard let data = line.data(using: .utf8) else { return }
  if let handle = FileHandle(forWritingAtPath: path) {
    handle.seekToEndOfFile()
    handle.write(data)
    try? handle.close()
  } else {
    try? line.write(toFile: path, atomically: true, encoding: .utf8)
  }
}

private func dumpTree(_ view: NSView, depth: Int) {
  let pad = String(repeating: "  ", count: depth)
  previewLog(
    "\(pad)\(type(of: view)) frame=\(view.frame) bounds=\(view.bounds) flipped=\(view.isFlipped)")
  if depth > 4 { return }
  for subview in view.subviews {
    dumpTree(subview, depth: depth + 1)
  }
}

private func onMain(_ work: @escaping () -> Void) {
  // AppKit views must be created and updated on the main thread.
  // Rust commands may enter Swift from background threads, so this helper hops safely.
  // If already on main, it runs immediately to avoid dispatching unnecessarily.
  if Thread.isMainThread {
    work()
  } else {
    DispatchQueue.main.sync(execute: work)
  }
}

@_cdecl("reeldock_start_preview")
public func reeldock_start_preview(
  _ surfaceId: UnsafePointer<CChar>?,
  _ windowPtr: UnsafeMutableRawPointer?,
  _ uniqueId: UnsafePointer<CChar>?,
  _ x: Double, _ y: Double, _ w: Double, _ h: Double,
  _ hostX: Double, _ hostY: Double, _ hostW: Double, _ hostH: Double,
  _ radius: Double, _ mirror: Bool
) -> Bool {
  guard let surfaceId, let windowPtr, let uniqueId else { return false }
  let id = String(cString: surfaceId)
  let device = String(cString: uniqueId)
  var started = false
  onMain {
    let window = Unmanaged<NSWindow>.fromOpaque(windowPtr).takeUnretainedValue()
    guard let host = previewHost(window) else { return }
    updatePreviewHost(host, hostX: hostX, hostY: hostY, hostW: hostW, hostH: hostH)
    let rect = previewSurfaceFrameInHost(id: id, host: host, x, y, w, h)
    previewLog(
      "START id=\(id) host=\(type(of: host)) flipped=\(host.isFlipped) hostFrame=\(host.frame) hostBounds=\(host.bounds) hostCss=(\(hostX),\(hostY),\(hostW),\(hostH)) css=(\(x),\(y),\(w),\(h)) native=\(rect)"
    )
    if let content = window.contentView {
      previewLog("WINDOW frame=\(window.frame) contentFrame=\(content.frame)")
      dumpTree(content, depth: 0)
    }
    started = PreviewManager.shared.start(
      id: id, host: host, uniqueId: device, rect: rect, radius: radius, mirror: mirror)
  }
  return started
}

@_cdecl("reeldock_set_preview_frame")
public func reeldock_set_preview_frame(
  _ surfaceId: UnsafePointer<CChar>?,
  _ windowPtr: UnsafeMutableRawPointer?,
  _ x: Double, _ y: Double, _ w: Double, _ h: Double,
  _ hostX: Double, _ hostY: Double, _ hostW: Double, _ hostH: Double,
  _ radius: Double
) {
  guard let surfaceId, let windowPtr else { return }
  let id = String(cString: surfaceId)
  onMain {
    let window = Unmanaged<NSWindow>.fromOpaque(windowPtr).takeUnretainedValue()
    guard let host = previewHost(window) else { return }
    updatePreviewHost(host, hostX: hostX, hostY: hostY, hostW: hostW, hostH: hostH)
    let rect = previewSurfaceFrameInHost(id: id, host: host, x, y, w, h)
    PreviewManager.shared.setFrame(id: id, rect: rect, radius: radius)
  }
}

@_cdecl("reeldock_stop_preview")
public func reeldock_stop_preview(_ surfaceId: UnsafePointer<CChar>?) {
  guard let surfaceId else { return }
  let id = String(cString: surfaceId)
  onMain {
    PreviewManager.shared.stop(id: id)
  }
}

@_cdecl("reeldock_set_preview_countdown")
public func reeldock_set_preview_countdown(
  _ windowPtr: UnsafeMutableRawPointer?,
  _ valuePtr: UnsafePointer<CChar>?
) {
  guard let windowPtr else { return }
  let value = valuePtr.map { String(cString: $0) }
  onMain {
    let window = Unmanaged<NSWindow>.fromOpaque(windowPtr).takeUnretainedValue()
    setCountdownOverlay(window, value: value)
  }
}

@_cdecl("reeldock_start_phone_audio_monitor")
public func reeldock_start_phone_audio_monitor(
  _ uniqueId: UnsafePointer<CChar>?,
  _ volume: Float
) -> Bool {
  // Rust calls this over FFI when the setup Sound toggle is enabled.
  // The selected phone uniqueId protects against routing audio from a stale preview session.
  // Returning Bool lets React retry while the native preview surface is still starting.
  guard let uniqueId else { return false }
  let device = String(cString: uniqueId)
  var started = false
  onMain {
    started = PreviewManager.shared.startAudioMonitor(id: "phone", uniqueId: device, volume: volume)
  }
  return started
}

@_cdecl("reeldock_stop_phone_audio_monitor")
public func reeldock_stop_phone_audio_monitor() {
  // This is intentionally global because the MVP only has one phone preview surface.
  // It is called on toggle off, setup unmount, and preview cleanup.
  // The actual recording session remains responsible for saving phone.mov.
  onMain {
    PreviewManager.shared.stopAudioMonitor(id: "phone")
  }
}
