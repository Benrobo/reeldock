import AVFoundation
import CoreGraphics
import ImageIO
import CoreMedia
import CoreVideo
import Foundation

private struct NativeExportInput: Codable {
  let projectId: String
  let outputPath: String
  let ratio: String
  let doc: NativeExportDoc
  let tracks: [NativeExportTrack]
  let backgroundImagePath: String?
}

private struct NativeExportTrack: Codable {
  let kind: String
  let filePath: String?
  let startOffsetMs: Int
  let durationMs: Int
}

private struct NativeExportSegment: Codable {
  let start: Double
  let end: Double
}

private struct NativeExportDoc: Codable {
  let phoneSize: String
  let phoneScale: Double?
  let frame: Bool
  let shadow: Bool
  let radius: Double
  let zoom: Double
  let camOn: Bool
  let camShape: String
  let camScale: Double
  let camScaleX: Double?
  let camScaleY: Double?
  let camRoundness: Double
  let mirror: Bool
  let crop: Double
  let bg: String
  let bgKind: String
  let grad: Int
  let pat: Int
  let fit: String
  let cw: Double
  let chh: Double
  let pad: Double
  let mic: Double
  let phoneVol: Double
  let webcamVol: Double
  let muted: Bool
  let dur: Double
  let segments: [NativeExportSegment]
  let phoneX: Double?
  let phoneY: Double?
  let camX: Double?
  let camY: Double?
  let sourceOrder: [String]?
}

private struct NativeExportResult: Codable {
  let ok: Bool
  let outputPath: String
  let durationMs: Int
}

private struct NativeExportError: Codable {
  let error: String
}

private struct NativeExportProgress: Codable {
  let projectId: String
  let progress: Double
  let stage: String
}

private typealias NativeExportProgressCallback = (String) -> Void
public typealias NativeExportProgressC = @convention(c) (UnsafePointer<CChar>?) -> Void

private struct NativeExportTimelineSpan {
  let originalStart: Double
  let originalEnd: Double
  let outputStart: Double

  var duration: Double {
    originalEnd - originalStart
  }
}

private struct NativeExportRect {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat

  var cgRect: CGRect {
    CGRect(x: x, y: y, width: width, height: height)
  }
}

private struct NativeExportGeometry {
  let phone: NativeExportRect
  let camera: NativeExportRect?
  let cameraRadius: CGFloat
}

private final class NativeExportVisualSource {
  let track: NativeExportTrack
  let asset: AVAsset
  let generator: AVAssetImageGenerator
  let duration: Double

  init(track: NativeExportTrack) throws {
    guard let filePath = track.filePath else {
      throw NSError(domain: "ReelDockExport", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "Missing \(track.kind) media file."
      ])
    }

    let asset = AVURLAsset(url: URL(fileURLWithPath: filePath))
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 60)
    generator.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 60)

    self.track = track
    self.asset = asset
    self.generator = generator
    duration = max(0, CMTimeGetSeconds(asset.duration))
  }

  func image(at originalTime: Double) -> CGImage? {
    let sourceTime = originalTime - Double(track.startOffsetMs) / 1000
    guard sourceTime >= 0, sourceTime <= duration else { return nil }
    return try? generator.copyCGImage(
      at: CMTime(seconds: sourceTime, preferredTimescale: 600),
      actualTime: nil
    )
  }

  func aspect(fallback: CGFloat) -> CGFloat {
    guard let videoTrack = asset.tracks(withMediaType: .video).first else { return fallback }
    let rect = CGRect(origin: .zero, size: videoTrack.naturalSize)
      .applying(videoTrack.preferredTransform)
    let width = abs(rect.width)
    let height = abs(rect.height)
    guard width > 0, height > 0 else { return fallback }
    return width / height
  }
}

private final class NativeProjectExporter {
  private let input: NativeExportInput
  private let progress: NativeExportProgressCallback?
  private let frameRate = 30
  private let timescale: CMTimeScale = 600
  private let colorSpace = CGColorSpaceCreateDeviceRGB()
  private let cameraScaleReference: CGFloat = 100

  init(input: NativeExportInput, progress: NativeExportProgressCallback? = nil) {
    self.input = input
    self.progress = progress
  }

  func export() throws -> NativeExportResult {
    reportProgress(2, stage: "Preparing export")
    let outputURL = URL(fileURLWithPath: input.outputPath)
    let outputDirectory = outputURL.deletingLastPathComponent()
    try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
    if FileManager.default.fileExists(atPath: input.outputPath) {
      try FileManager.default.removeItem(at: outputURL)
    }

    let tempVideoURL = outputDirectory.appendingPathComponent(
      ".\(input.projectId)-\(UUID().uuidString)-video.mov"
    )
    if FileManager.default.fileExists(atPath: tempVideoURL.path) {
      try FileManager.default.removeItem(at: tempVideoURL)
    }

    let spans = timelineSpans()
    let totalDuration = spans.reduce(0) { $0 + $1.duration }
    guard totalDuration > 0 else {
      throw NSError(domain: "ReelDockExport", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "There is no timeline duration to export."
      ])
    }

    let renderSize = outputSize()
    let visualSources = try makeVisualSources()
    reportProgress(8, stage: "Reading source tracks")
    try renderSilentVideo(
      to: tempVideoURL,
      renderSize: renderSize,
      totalDuration: totalDuration,
      spans: spans,
      visualSources: visualSources
    )
    reportProgress(82, stage: "Mixing audio")
    try muxAudio(
      silentVideoURL: tempVideoURL,
      outputURL: outputURL,
      totalDuration: totalDuration,
      spans: spans
    )
    try? FileManager.default.removeItem(at: tempVideoURL)
    reportProgress(100, stage: "Done")

    return NativeExportResult(
      ok: true,
      outputPath: input.outputPath,
      durationMs: max(1, Int(totalDuration * 1000))
    )
  }

  private func reportProgress(_ progressValue: Double, stage: String) {
    guard let progress else { return }
    let event = NativeExportProgress(
      projectId: input.projectId,
      progress: max(0, min(100, progressValue)),
      stage: stage
    )
    guard let data = try? JSONEncoder().encode(event),
      let json = String(data: data, encoding: .utf8)
    else { return }
    progress(json)
  }

  private func makeVisualSources() throws -> [String: NativeExportVisualSource] {
    var sources: [String: NativeExportVisualSource] = [:]
    if let phoneTrack = track(kind: "phone") {
      sources["phone"] = try NativeExportVisualSource(track: phoneTrack)
    }
    guard sources["phone"] != nil else {
      throw NSError(domain: "ReelDockExport", code: 12, userInfo: [
        NSLocalizedDescriptionKey: "Export needs a recorded phone video."
      ])
    }
    if input.doc.camOn, let webcamTrack = track(kind: "webcam") {
      sources["webcam"] = try NativeExportVisualSource(track: webcamTrack)
    }
    return sources
  }

  private func renderSilentVideo(
    to url: URL,
    renderSize: CGSize,
    totalDuration: Double,
    spans: [NativeExportTimelineSpan],
    visualSources: [String: NativeExportVisualSource]
  ) throws {
    let writer = try AVAssetWriter(outputURL: url, fileType: .mov)
    let videoInput = AVAssetWriterInput(
      mediaType: .video,
      outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: Int(renderSize.width),
        AVVideoHeightKey: Int(renderSize.height),
        AVVideoCompressionPropertiesKey: [
          AVVideoAverageBitRateKey: max(8_000_000, Int(renderSize.width * renderSize.height * 4)),
          AVVideoExpectedSourceFrameRateKey: frameRate,
        ],
      ]
    )
    videoInput.expectsMediaDataInRealTime = false

    guard writer.canAdd(videoInput) else {
      throw NSError(domain: "ReelDockExport", code: 3, userInfo: [
        NSLocalizedDescriptionKey: "Could not configure export video writer."
      ])
    }
    writer.add(videoInput)

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: videoInput,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: Int(renderSize.width),
        kCVPixelBufferHeightKey as String: Int(renderSize.height),
      ]
    )

    guard writer.startWriting() else {
      throw NSError(domain: "ReelDockExport", code: 4, userInfo: [
        NSLocalizedDescriptionKey: writer.error?.localizedDescription ?? "Could not start export writer."
      ])
    }
    writer.startSession(atSourceTime: .zero)

    let frameCount = max(1, Int(ceil(totalDuration * Double(frameRate))))
    let phoneAspect = visualSources["phone"]?.aspect(fallback: 390 / 844) ?? 390 / 844
    let geometry = exportGeometry(renderSize: renderSize, phoneAspect: phoneAspect)
    let progressStep = max(1, frameRate / 2)
    var renderError: Error?

    for frameIndex in 0..<frameCount {
      autoreleasepool {
        if renderError != nil { return }
        while !videoInput.isReadyForMoreMediaData {
          Thread.sleep(forTimeInterval: 0.004)
        }
        let exportTime = Double(frameIndex) / Double(frameRate)
        guard let originalTime = originalTime(for: exportTime, spans: spans) else {
          renderError = NSError(domain: "ReelDockExport", code: 9, userInfo: [
            NSLocalizedDescriptionKey: "Could not map export time to source timeline."
          ])
          return
        }
        guard let pixelBuffer = makePixelBuffer(adaptor: adaptor, size: renderSize) else {
          renderError = NSError(domain: "ReelDockExport", code: 10, userInfo: [
            NSLocalizedDescriptionKey: "Could not allocate export frame buffer."
          ])
          return
        }

        drawFrame(
          pixelBuffer: pixelBuffer,
          renderSize: renderSize,
          geometry: geometry,
          originalTime: originalTime,
          visualSources: visualSources
        )
        let presentationTime = CMTime(value: CMTimeValue(frameIndex), timescale: CMTimeScale(frameRate))
        if !adaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
          renderError = NSError(domain: "ReelDockExport", code: 11, userInfo: [
            NSLocalizedDescriptionKey: writer.error?.localizedDescription ?? "Could not append export frame."
          ])
          return
        }

        if frameIndex % progressStep == 0 || frameIndex == frameCount - 1 {
          let progressValue = 10 + (Double(frameIndex + 1) / Double(frameCount)) * 70
          reportProgress(progressValue, stage: "Compositing sources")
        }
      }
    }

    if let renderError {
      videoInput.markAsFinished()
      writer.cancelWriting()
      throw renderError
    }

    videoInput.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting {
      semaphore.signal()
    }
    semaphore.wait()

    guard writer.status == .completed else {
      throw NSError(domain: "ReelDockExport", code: 5, userInfo: [
        NSLocalizedDescriptionKey: writer.error?.localizedDescription ?? "Could not finish export video."
      ])
    }
  }

  private func muxAudio(
    silentVideoURL: URL,
    outputURL: URL,
    totalDuration: Double,
    spans: [NativeExportTimelineSpan]
  ) throws {
    let composition = AVMutableComposition()
    let totalTime = CMTime(seconds: totalDuration, preferredTimescale: timescale)
    let videoAsset = AVURLAsset(url: silentVideoURL)
    guard let sourceVideo = videoAsset.tracks(withMediaType: .video).first,
      let videoTrack = composition.addMutableTrack(
        withMediaType: .video,
        preferredTrackID: kCMPersistentTrackID_Invalid
      )
    else {
      throw NSError(domain: "ReelDockExport", code: 6, userInfo: [
        NSLocalizedDescriptionKey: "Rendered export video is missing."
      ])
    }

    try videoTrack.insertTimeRange(
      CMTimeRange(start: .zero, duration: totalTime),
      of: sourceVideo,
      at: .zero
    )

    let audioMix = AVMutableAudioMix()
    audioMix.inputParameters = try audioMixParameters(composition: composition, spans: spans)

    guard let exportSession = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality
    ) else {
      throw NSError(domain: "ReelDockExport", code: 7, userInfo: [
        NSLocalizedDescriptionKey: "Could not create MP4 export session."
      ])
    }

    exportSession.outputURL = outputURL
    exportSession.outputFileType = .mp4
    exportSession.shouldOptimizeForNetworkUse = true
    if !audioMix.inputParameters.isEmpty {
      exportSession.audioMix = audioMix
    }

    let semaphore = DispatchSemaphore(value: 0)
    exportSession.exportAsynchronously {
      semaphore.signal()
    }
    while semaphore.wait(timeout: .now() + 0.2) == .timedOut {
      reportProgress(82 + Double(exportSession.progress) * 16, stage: "Writing MP4")
    }

    guard exportSession.status == .completed else {
      throw NSError(domain: "ReelDockExport", code: 8, userInfo: [
        NSLocalizedDescriptionKey: exportSession.error?.localizedDescription ?? "Could not write MP4 export."
      ])
    }
  }

  private func audioMixParameters(
    composition: AVMutableComposition,
    spans: [NativeExportTimelineSpan]
  ) throws -> [AVMutableAudioMixInputParameters] {
    var parameters: [AVMutableAudioMixInputParameters] = []
    var usedAudioKeys = Set<String>()

    func addAudio(track: NativeExportTrack?, volume: Float, key: String) throws {
      guard volume > 0, let track, let filePath = track.filePath, !usedAudioKeys.contains(key) else { return }
      let asset = AVURLAsset(url: URL(fileURLWithPath: filePath))
      guard let sourceAudio = asset.tracks(withMediaType: .audio).first,
        let compositionTrack = composition.addMutableTrack(
          withMediaType: .audio,
          preferredTrackID: kCMPersistentTrackID_Invalid
        )
      else { return }

      try insertTimelineSpans(
        sourceTrack: sourceAudio,
        into: compositionTrack,
        sourceDuration: CMTimeGetSeconds(asset.duration),
        startOffsetMs: track.startOffsetMs,
        spans: spans
      )

      let parameter = AVMutableAudioMixInputParameters(track: compositionTrack)
      parameter.setVolume(volume, at: .zero)
      parameters.append(parameter)
      usedAudioKeys.insert(key)
    }

    let phoneTrack = track(kind: "phone")
    let webcamTrack = track(kind: "webcam")
    let microphoneTrack = track(kind: "microphone")
    let phoneVolume = volumeGain(input.doc.phoneVol)
    let webcamVolume = volumeGain(input.doc.webcamVol)
    let microphoneVolume = input.doc.muted ? 0 : volumeGain(input.doc.mic)
    let microphoneSharesWebcam = microphoneTrack?.filePath != nil
      && microphoneTrack?.filePath == webcamTrack?.filePath

    try addAudio(track: phoneTrack, volume: phoneVolume, key: "phone")

    if microphoneSharesWebcam {
      let linkedVolume = input.doc.camOn ? microphoneVolume * webcamVolume : microphoneVolume
      try addAudio(track: microphoneTrack, volume: linkedVolume, key: microphoneTrack?.filePath ?? "microphone")
    } else {
      try addAudio(track: microphoneTrack, volume: microphoneVolume, key: microphoneTrack?.filePath ?? "microphone")
      try addAudio(track: webcamTrack, volume: webcamVolume, key: webcamTrack?.filePath ?? "webcam")
    }

    return parameters
  }

  private func insertTimelineSpans(
    sourceTrack: AVAssetTrack,
    into compositionTrack: AVMutableCompositionTrack,
    sourceDuration: Double,
    startOffsetMs: Int,
    spans: [NativeExportTimelineSpan]
  ) throws {
    let startOffset = Double(startOffsetMs) / 1000
    for span in spans {
      let availableOriginalStart = max(span.originalStart, startOffset)
      let sourceStart = max(0, availableOriginalStart - startOffset)
      let outputStart = span.outputStart + max(0, availableOriginalStart - span.originalStart)
      let requestedDuration = span.originalEnd - availableOriginalStart
      let availableDuration = sourceDuration - sourceStart
      let insertDuration = min(requestedDuration, availableDuration)
      guard insertDuration > 0 else { continue }

      try compositionTrack.insertTimeRange(
        CMTimeRange(
          start: CMTime(seconds: sourceStart, preferredTimescale: timescale),
          duration: CMTime(seconds: insertDuration, preferredTimescale: timescale)
        ),
        of: sourceTrack,
        at: CMTime(seconds: outputStart, preferredTimescale: timescale)
      )
    }
  }

  private func drawFrame(
    pixelBuffer: CVPixelBuffer,
    renderSize: CGSize,
    geometry: NativeExportGeometry,
    originalTime: Double,
    visualSources: [String: NativeExportVisualSource]
  ) {
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer),
      let context = CGContext(
        data: baseAddress,
        width: Int(renderSize.width),
        height: Int(renderSize.height),
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
          | CGBitmapInfo.byteOrder32Little.rawValue
      )
    else { return }

    context.translateBy(x: 0, y: renderSize.height)
    context.scaleBy(x: 1, y: -1)
    drawBackground(context: context, size: renderSize)

    for layer in sourceLayerOrder() {
      if layer == "phone", let phoneImage = visualSources["phone"]?.image(at: originalTime) {
        drawPhone(image: phoneImage, context: context, rect: geometry.phone.cgRect)
      }

      if layer == "camera",
        let cameraRect = geometry.camera?.cgRect,
        let webcamImage = visualSources["webcam"]?.image(at: originalTime)
      {
        drawRoundedImage(
          image: webcamImage,
          context: context,
          rect: cameraRect,
          radius: geometry.cameraRadius,
          positionX: CGFloat(max(0, min(100, input.doc.crop)) / 100),
          positionY: 0.5,
          zoom: 1,
          mirrored: input.doc.mirror
        )
      }
    }
  }

  private func sourceLayerOrder() -> [String] {
    var result: [String] = []

    func appendLayer(_ layer: String) {
      guard (layer == "phone" || layer == "camera") && !result.contains(layer) else { return }
      result.append(layer)
    }

    for layer in input.doc.sourceOrder ?? [] {
      appendLayer(layer)
    }
    appendLayer("phone")
    appendLayer("camera")
    return result
  }

  private func drawPhone(image: CGImage, context: CGContext, rect: CGRect) {
    let border = input.doc.frame ? max(4, min(rect.width, rect.height) * 0.012) : 0
    let innerRadius = min(CGFloat(input.doc.radius), min(rect.width, rect.height) / 2)
    let outerRadius = innerRadius + border

    if input.doc.frame {
      context.saveGState()
      context.addPath(CGPath(roundedRect: rect, cornerWidth: outerRadius, cornerHeight: outerRadius, transform: nil))
      context.setFillColor(CGColor(red: 0.02, green: 0.018, blue: 0.016, alpha: 1))
      context.fillPath()
      context.restoreGState()
    }

    let screenRect = rect.insetBy(dx: border, dy: border)
    drawRoundedImage(
      image: image,
      context: context,
      rect: screenRect,
      radius: innerRadius,
      positionX: 0.5,
      positionY: 0.5,
      zoom: CGFloat(max(0.1, input.doc.zoom / 100)),
      mirrored: false
    )
  }

  private func drawRoundedImage(
    image: CGImage,
    context: CGContext,
    rect: CGRect,
    radius: CGFloat,
    positionX: CGFloat,
    positionY: CGFloat,
    zoom: CGFloat,
    mirrored: Bool
  ) {
    context.saveGState()
    context.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
    context.clip()

    if mirrored {
      context.translateBy(x: rect.midX, y: rect.midY)
      context.scaleBy(x: -1, y: 1)
      context.translateBy(x: -rect.midX, y: -rect.midY)
    }

    let imageSize = CGSize(width: image.width, height: image.height)
    let scale = max(rect.width / imageSize.width, rect.height / imageSize.height) * zoom
    let scaledWidth = imageSize.width * scale
    let scaledHeight = imageSize.height * scale
    let overflowX = max(0, scaledWidth - rect.width)
    let overflowY = max(0, scaledHeight - rect.height)
    let drawRect = CGRect(
      x: rect.minX - overflowX * positionX,
      y: rect.minY - overflowY * positionY,
      width: scaledWidth,
      height: scaledHeight
    )

    context.saveGState()
    context.translateBy(x: drawRect.midX, y: drawRect.midY)
    context.scaleBy(x: 1, y: -1)
    context.translateBy(x: -drawRect.midX, y: -drawRect.midY)
    context.draw(image, in: drawRect)
    context.restoreGState()
    context.restoreGState()
  }

  private func drawBackground(context: CGContext, size: CGSize) {
    if input.doc.bgKind == "image", let image = backgroundImage() {
      drawBackgroundImage(image: image, context: context, size: size)
      return
    }

    if input.doc.bgKind == "gradient" {
      let colors = gradientColors(index: input.doc.grad)
      if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors as CFArray, locations: [0, 1]) {
        context.drawLinearGradient(
          gradient,
          start: CGPoint(x: 0, y: 0),
          end: CGPoint(x: size.width, y: size.height),
          options: []
        )
        return
      }
    }

    context.setFillColor(backgroundColor())
    context.fill(CGRect(origin: .zero, size: size))
  }

  private func drawBackgroundImage(image: CGImage, context: CGContext, size: CGSize) {
    let imageSize = CGSize(width: image.width, height: image.height)
    guard imageSize.width > 0, imageSize.height > 0 else { return }

    let scale: CGFloat = input.doc.fit == "contain"
      ? min(size.width / imageSize.width, size.height / imageSize.height)
      : max(size.width / imageSize.width, size.height / imageSize.height)
    let drawSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
    let drawRect = CGRect(
      x: (size.width - drawSize.width) / 2,
      y: (size.height - drawSize.height) / 2,
      width: drawSize.width,
      height: drawSize.height
    )

    context.setFillColor(backgroundColor())
    context.fill(CGRect(origin: .zero, size: size))
    context.draw(image, in: drawRect)
  }

  private func backgroundImage() -> CGImage? {
    if let image = backgroundDataImage() {
      return image
    }
    guard let path = input.backgroundImagePath ?? backgroundImagePathFromDoc() else { return nil }
    let expandedPath = expandHome(path)
    guard FileManager.default.fileExists(atPath: expandedPath) else { return nil }
    let url = URL(fileURLWithPath: expandedPath)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(source, 0, nil)
  }

  private func backgroundDataImage() -> CGImage? {
    guard input.doc.bg.hasPrefix("data:"),
      let comma = input.doc.bg.firstIndex(of: ",")
    else { return nil }
    let encoded = String(input.doc.bg[input.doc.bg.index(after: comma)...])
    guard let data = Data(base64Encoded: encoded),
      let source = CGImageSourceCreateWithData(data as CFData, nil)
    else { return nil }
    return CGImageSourceCreateImageAtIndex(source, 0, nil)
  }

  private func backgroundImagePathFromDoc() -> String? {
    if input.doc.bg.hasPrefix("file://") {
      return String(input.doc.bg.dropFirst("file://".count))
    }
    if input.doc.bg.hasPrefix("/") || input.doc.bg.hasPrefix("~/") {
      return input.doc.bg
    }
    return nil
  }

  private func expandHome(_ path: String) -> String {
    guard path.hasPrefix("~/") else { return path }
    return FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent(String(path.dropFirst(2)))
      .path
  }

  private func makePixelBuffer(
    adaptor: AVAssetWriterInputPixelBufferAdaptor,
    size: CGSize
  ) -> CVPixelBuffer? {
    guard let pool = adaptor.pixelBufferPool else { return nil }
    var pixelBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer) == kCVReturnSuccess else {
      return nil
    }
    return pixelBuffer
  }

  private func exportGeometry(renderSize: CGSize, phoneAspect: CGFloat) -> NativeExportGeometry {
    let canvasAspect = renderSize.width / renderSize.height
    let padY = CGFloat(input.doc.pad / 100)
    let padX = padY / canvasAspect
    let x0 = padX
    let y0 = padY
    let availableWidth = 1 - 2 * padX
    let availableHeight = 1 - 2 * padY
    let basePhoneHeight = availableHeight * phoneHeightFactor()
    let basePhoneWidth = basePhoneHeight * phoneAspect / canvasAspect

    let basePhoneX: CGFloat
    let basePhoneY: CGFloat
    let baseCameraX: CGFloat
    let baseCameraY: CGFloat
    let baseCameraWidth: CGFloat
    let baseCameraHeight: CGFloat

    if input.doc.camOn {
      let cameraAspect = cameraAspectRatio()
      baseCameraHeight = basePhoneHeight * 0.8
      baseCameraWidth = baseCameraHeight * cameraAspect / canvasAspect
      let gap = min(availableWidth * 0.055, 0.055)
      let groupWidth = basePhoneWidth + gap + baseCameraWidth

      if groupWidth <= availableWidth {
        let groupX = x0 + (availableWidth - groupWidth) / 2
        basePhoneX = groupX
        basePhoneY = y0 + (availableHeight - basePhoneHeight) / 2
        baseCameraX = groupX + basePhoneWidth + gap
        baseCameraY = y0 + (availableHeight - baseCameraHeight) / 2
      } else {
        basePhoneX = x0 + (availableWidth - basePhoneWidth) / 2
        basePhoneY = y0 + (availableHeight - basePhoneHeight) / 2
        baseCameraX = x0 + availableWidth - baseCameraWidth
        baseCameraY = y0 + availableHeight - baseCameraHeight
      }
    } else {
      basePhoneX = x0 + (availableWidth - basePhoneWidth) / 2
      basePhoneY = y0 + (availableHeight - basePhoneHeight) / 2
      baseCameraX = 0
      baseCameraY = 0
      baseCameraWidth = 0
      baseCameraHeight = 0
    }

    let phoneScale = CGFloat((input.doc.phoneScale ?? 100) / 100)
    let phoneWidth = basePhoneWidth * phoneScale
    let phoneHeight = basePhoneHeight * phoneScale
    let defaultPhoneX = basePhoneX + (basePhoneWidth - phoneWidth) / 2
    let defaultPhoneY = basePhoneY + (basePhoneHeight - phoneHeight) / 2
    let phone = normalizedPhoneRect(
      x: CGFloat(input.doc.phoneX ?? Double(defaultPhoneX)),
      y: CGFloat(input.doc.phoneY ?? Double(defaultPhoneY)),
      width: phoneWidth,
      height: phoneHeight,
      renderSize: renderSize
    )

    guard input.doc.camOn else {
      return NativeExportGeometry(phone: phone, camera: nil, cameraRadius: 0)
    }

    let camScaleX = CGFloat((input.doc.camScaleX ?? input.doc.camScale) / Double(cameraScaleReference))
    let camScaleY = CGFloat((input.doc.camScaleY ?? input.doc.camScale) / Double(cameraScaleReference))
    let cameraWidth = baseCameraWidth * camScaleX
    let cameraHeight = baseCameraHeight * camScaleY
    let scaledDefaultCameraX = baseCameraX + (baseCameraWidth - cameraWidth) / 2
    let scaledDefaultCameraY = baseCameraY + (baseCameraHeight - cameraHeight) / 2
    let camera = normalizedPhoneRect(
      x: CGFloat(input.doc.camX ?? Double(scaledDefaultCameraX)),
      y: CGFloat(input.doc.camY ?? Double(scaledDefaultCameraY)),
      width: cameraWidth,
      height: cameraHeight,
      renderSize: renderSize
    )
    let radius = min(camera.cgRect.width, camera.cgRect.height) / 2
      * CGFloat(input.doc.camRoundness / 100)

    return NativeExportGeometry(phone: phone, camera: camera, cameraRadius: radius)
  }

  private func normalizedPhoneRect(
    x: CGFloat,
    y: CGFloat,
    width: CGFloat,
    height: CGFloat,
    renderSize: CGSize
  ) -> NativeExportRect {
    NativeExportRect(
      x: x * renderSize.width,
      y: y * renderSize.height,
      width: width * renderSize.width,
      height: height * renderSize.height
    )
  }

  private func timelineSpans() -> [NativeExportTimelineSpan] {
    let sourceSegments = input.doc.segments.isEmpty
      ? [NativeExportSegment(start: 0, end: input.doc.dur)]
      : input.doc.segments
    var cursor = 0.0
    var spans: [NativeExportTimelineSpan] = []

    for segment in sourceSegments {
      let start = max(0, min(input.doc.dur, segment.start))
      let end = max(start, min(input.doc.dur, segment.end))
      guard end > start else { continue }
      spans.append(NativeExportTimelineSpan(originalStart: start, originalEnd: end, outputStart: cursor))
      cursor += end - start
    }

    if spans.isEmpty {
      return [NativeExportTimelineSpan(originalStart: 0, originalEnd: max(1, input.doc.dur), outputStart: 0)]
    }
    return spans
  }

  private func originalTime(for exportTime: Double, spans: [NativeExportTimelineSpan]) -> Double? {
    for span in spans {
      if exportTime >= span.outputStart && exportTime < span.outputStart + span.duration {
        return span.originalStart + exportTime - span.outputStart
      }
    }
    guard let last = spans.last else { return nil }
    return max(last.originalStart, last.originalEnd - 1 / Double(frameRate))
  }

  private func track(kind: String) -> NativeExportTrack? {
    input.tracks.first { track in
      track.kind == kind && track.filePath != nil && FileManager.default.fileExists(atPath: track.filePath ?? "")
    }
  }

  private func outputSize() -> CGSize {
    switch input.ratio {
    case "9:16":
      return CGSize(width: 1080, height: 1920)
    case "1:1":
      return CGSize(width: 1080, height: 1080)
    case "4:5":
      return CGSize(width: 1080, height: 1350)
    case "5:4":
      return CGSize(width: 1350, height: 1080)
    case "4:3":
      return CGSize(width: 1440, height: 1080)
    case "3:4":
      return CGSize(width: 1080, height: 1440)
    case "21:9":
      return CGSize(width: 2560, height: 1080)
    case "custom":
      return CGSize(width: evenDimension(input.doc.cw), height: evenDimension(input.doc.chh))
    default:
      return CGSize(width: 1920, height: 1080)
    }
  }

  private func evenDimension(_ value: Double) -> CGFloat {
    let clamped = max(320, min(3840, Int(value.rounded())))
    return CGFloat(clamped - clamped % 2)
  }

  private func phoneHeightFactor() -> CGFloat {
    switch input.doc.phoneSize {
    case "S":
      return 0.8
    case "M":
      return 0.9
    default:
      return 1
    }
  }

  private func cameraAspectRatio() -> CGFloat {
    switch input.doc.camShape {
    case "square", "circle":
      return 1
    case "vertical":
      return 9 / 16
    default:
      return 16 / 9
    }
  }

  private func backgroundColor() -> CGColor {
    if input.doc.bgKind == "solid", let color = hexColor(input.doc.bg) {
      return color
    }
    return CGColor(red: 0.055, green: 0.052, blue: 0.047, alpha: 1)
  }

  private func gradientColors(index: Int) -> [CGColor] {
    let colors: [[CGColor]] = [
      [
        CGColor(red: 0.055, green: 0.052, blue: 0.047, alpha: 1),
        CGColor(red: 0.18, green: 0.17, blue: 0.15, alpha: 1),
      ],
      [
        CGColor(red: 0.08, green: 0.12, blue: 0.16, alpha: 1),
        CGColor(red: 0.20, green: 0.34, blue: 0.32, alpha: 1),
      ],
      [
        CGColor(red: 0.16, green: 0.11, blue: 0.08, alpha: 1),
        CGColor(red: 0.34, green: 0.18, blue: 0.12, alpha: 1),
      ],
      [
        CGColor(red: 0.055, green: 0.052, blue: 0.047, alpha: 1),
        CGColor(red: 0.17, green: 0.20, blue: 0.26, alpha: 1),
      ],
      [
        CGColor(red: 0.10, green: 0.16, blue: 0.22, alpha: 1),
        CGColor(red: 0.18, green: 0.10, blue: 0.10, alpha: 1),
      ],
      [
        CGColor(red: 0.94, green: 0.90, blue: 0.82, alpha: 1),
        CGColor(red: 0.13, green: 0.12, blue: 0.10, alpha: 1),
      ],
    ]
    return colors[max(0, min(colors.count - 1, index))]
  }

  private func hexColor(_ value: String) -> CGColor? {
    var raw = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if raw.hasPrefix("#") {
      raw.removeFirst()
    }
    guard raw.count == 6, let intValue = Int(raw, radix: 16) else { return nil }
    let red = CGFloat((intValue >> 16) & 0xff) / 255
    let green = CGFloat((intValue >> 8) & 0xff) / 255
    let blue = CGFloat(intValue & 0xff) / 255
    return CGColor(red: red, green: green, blue: blue, alpha: 1)
  }

  private func volumeGain(_ value: Double) -> Float {
    let normalized = max(0, min(100, value)) / 100
    return Float(normalized * normalized)
  }
}

private func exportJson<T: Encodable>(_ value: T) -> UnsafeMutablePointer<CChar>? {
  guard let data = try? JSONEncoder().encode(value),
    let json = String(data: data, encoding: .utf8)
  else {
    return strdup("{\"error\":\"Could not encode native export response.\"}")
  }
  return strdup(json)
}

private func exportErrorJson(_ error: Error) -> UnsafeMutablePointer<CChar>? {
  exportJson(NativeExportError(error: error.localizedDescription))
}

@_cdecl("reeldock_export_project_json")
public func reeldock_export_project_json(
  _ inputJson: UnsafePointer<CChar>?
) -> UnsafeMutablePointer<CChar>? {
  reeldock_export_project_json_with_progress(inputJson, nil)
}

@_cdecl("reeldock_export_project_json_with_progress")
public func reeldock_export_project_json_with_progress(
  _ inputJson: UnsafePointer<CChar>?,
  _ progressCallback: NativeExportProgressC?
) -> UnsafeMutablePointer<CChar>? {
  guard let inputJson else {
    return exportJson(NativeExportError(error: "Export input was missing."))
  }

  do {
    let data = Data(String(cString: inputJson).utf8)
    let input = try JSONDecoder().decode(NativeExportInput.self, from: data)
    let callback: NativeExportProgressCallback? = progressCallback.map { progressCallback in
      { json in
        json.withCString { pointer in
          progressCallback(pointer)
        }
      }
    }
    return exportJson(try NativeProjectExporter(input: input, progress: callback).export())
  } catch {
    return exportErrorJson(error)
  }
}
