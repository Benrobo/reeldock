import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft01Icon,
  CameraVideoIcon,
  ColorPickerIcon,
  FolderExportIcon,
  LayoutTopIcon,
  Mic01Icon,
  MoreVerticalIcon,
  PauseIcon,
  PlayIcon,
  SmartPhone01Icon,
  VolumeHighIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import {
  ActivitySpinner,
  Button,
  CodeBlock,
  Divider,
  DropZone,
  HelpBadge,
  IconButton,
  Modal,
  ProgressBar,
  Segmented,
  SettingsList,
  SettingsRow,
  Slider,
  Stepper,
  SurfaceRow,
  Swatch,
  SwitchRow,
  Timecode,
  ToolButton,
  TransportButton,
  ValueChip,
  cn,
} from "@reeldock/ui";
import { ColorIcon } from "@/components/color-icon";
import type { ColorIconTone } from "@/components/color-icon";
import {
  BACKGROUND_KINDS,
  CAMERA_ANCHORS,
  CAMERA_SHAPES,
  CANVAS_FITS,
  CANVAS_RATIOS,
  ELEMENT_SIZES,
  LAYOUTS,
  RATIO_RESOLUTIONS,
  SIZE_LABELS,
  type BackgroundKind,
  type CameraShape,
  type CanvasFit,
  type CanvasRatio,
  type ElementSize,
  type LayoutId,
} from "@reeldock/shared";
import { EXPORT_QUALITY_LABEL } from "@/constants/recording";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import { timecode } from "@/lib/format";
import { CanvasStage, useStageSize } from "@/modules/canvas";
import {
  GRADIENTS,
  LayoutGrid,
  PATTERNS,
  cutRegions,
  keptDuration,
  removeAt,
  splitAt,
  useProject,
} from "@/modules/project";
import {
  EDITOR_SECTIONS,
  FILMSTRIP_COLORS,
  LAYOUT_RATIO_HINT,
  SOLID_BACKGROUNDS,
  WAVEFORM_HEIGHTS,
  type EditorSection,
} from "../data/editor-data";
import { projectsService, type ExportJobRecord } from "@/services";

type ExportState = "idle" | "running" | "done" | "failed";

const sectionIcons = {
  layout: LayoutTopIcon,
  phone: SmartPhone01Icon,
  camera: CameraVideoIcon,
  canvas: ColorPickerIcon,
  audio: VolumeHighIcon,
} as const;

const sectionIconTones = {
  layout: "control",
  phone: "phone",
  camera: "camera",
  canvas: "canvas",
  audio: "microphone",
} as const satisfies Record<keyof typeof sectionIcons, ColorIconTone>;

function toRatio(value: string): CanvasRatio {
  return value === "Custom" ? "custom" : (value as CanvasRatio);
}

function ratioLabel(value: CanvasRatio): string {
  return value === "custom" ? "Custom" : value;
}

function percent(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export function EditorPage() {
  const { ref, size } = useStageSize();
  const stripRef = useRef<HTMLDivElement>(null);
  const doc = useProject((state) => state.doc);
  const activeProject = useProject((state) => state.activeProject);
  const loadProject = useProject((state) => state.loadProject);
  const markSaved = useProject((state) => state.markSaved);
  const update = useProject((state) => state.update);
  const undo = useProject((state) => state.undo);
  const redo = useProject((state) => state.redo);
  const canUndo = useProject((state) => state.canUndo);
  const canRedo = useProject((state) => state.canRedo);
  const isEdited = useProject((state) => state.isEdited);
  const selectedSegment = useProject((state) => state.selectedSegment);
  const selectSegment = useProject((state) => state.selectSegment);
  const time = useProject((state) => state.time);
  const setTime = useProject((state) => state.setTime);
  const [section, setSection] = useState<EditorSection>("layout");
  const [playing, setPlaying] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportRatio, setExportRatio] = useState<Exclude<CanvasRatio, "custom">>("16:9");
  const [exportPct, setExportPct] = useState(0);
  const [exportJob, setExportJob] = useState<ExportJobRecord | null>(null);
  const [completedExportId, setCompletedExportId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const activeProjectId = activeProject?.id ?? null;
  const selectedSection = EDITOR_SECTIONS.find((item) => item.id === section) ?? EDITOR_SECTIONS[0];
  const cutSummary = `${doc.segments.length} kept segment${doc.segments.length === 1 ? "" : "s"} · ${timecode(
    keptDuration(doc.segments)
  )}`;
  const removed = useMemo(() => cutRegions(doc.segments, doc.dur), [doc.segments, doc.dur]);

  useEffect(() => {
    if (activeProject) return;
    let cancelled = false;

    projectsService
      .active()
      .then((project) => {
        if (!cancelled && project) {
          setStorageError(null);
          loadProject(project);
        }
      })
      .catch(() => {
        if (!cancelled) setStorageError("Local SQLite storage is unavailable.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject, loadProject]);

  useEffect(() => {
    if (!activeProjectId) return;
    const timer = window.setTimeout(() => {
      void projectsService
        .find(activeProjectId)
        .then((project) => {
          if (!project) return;
          void projectsService
            .saveDoc(project, doc)
            .then((saved) => {
              setStorageError(null);
              markSaved(saved);
            })
            .catch(() => setStorageError("Could not save changes to local SQLite."));
        })
        .catch(() => setStorageError("Could not save changes to local SQLite."));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [activeProjectId, doc, markSaved]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTime(Math.min(doc.dur, time + 0.25));
    }, 250);
    return () => window.clearInterval(timer);
  }, [doc.dur, playing, setTime, time]);

  useEffect(() => {
    if (exportState !== "running") return;
    const timer = window.setInterval(() => {
      setExportPct((current) => {
        const next = current + 4;
        if (next >= 100) {
          window.clearInterval(timer);
          setExportState("done");
          return 100;
        }
        return next;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [exportState]);

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((event.clientX - rect.left) / rect.width) * doc.dur;
    setTime(Math.max(0, Math.min(doc.dur, next)));
  };

  const split = () => {
    const result = splitAt(doc.segments, time);
    if (!result) return;
    update({ segments: result.segments });
    selectSegment(result.selected);
  };

  const remove = () => {
    const result = removeAt(doc.segments, selectedSegment);
    if (!result) return;
    update({ segments: result.segments });
    selectSegment(result.selected);
  };

  const chooseLayout = (layout: LayoutId) => {
    update({ layout, ratio: LAYOUT_RATIO_HINT[layout] ?? doc.ratio, swap: false });
    setSection("layout");
  };

  useEffect(() => {
    if (exportState !== "done" || !exportJob || completedExportId === exportJob.id) return;
    setCompletedExportId(exportJob.id);
    void projectsService
      .completeExport(exportJob)
      .then(async () => {
        const project = activeProjectId ? await projectsService.find(activeProjectId) : null;
        if (!project) return;
        const exported = await projectsService.setStatus(project, "exported");
        loadProject(exported);
      })
      .catch(() => setStorageError("Could not save the export job to local SQLite."));
  }, [activeProjectId, completedExportId, exportJob, exportState, loadProject]);

  const startExport = async () => {
    setExportPct(0);
    setCompletedExportId(null);
    try {
      const project = activeProject
        ? await projectsService.find(activeProject.id)
        : await projectsService.active();
      if (!project) {
        setExportState("failed");
        return;
      }
      const job = await projectsService.createExport(project, exportRatio);
      setStorageError(null);
      setExportJob(job);
      setExportState("running");
    } catch {
      setStorageError("Could not create an export job because local SQLite is unavailable.");
      setExportState("failed");
    }
  };

  return (
    <main className="bg-window relative flex h-full min-w-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-titlebar-line bg-titlebar flex h-[52px] items-center gap-3.5 border-b px-[18px]">
          <Link to="/">
            <Button
              leading={<ColorIcon icon={ArrowLeft01Icon} size={15} tone="back" />}
              size="mini"
            >
              Projects
            </Button>
          </Link>
          <div className="text-[13px] font-semibold">
            {activeProject?.name ?? "ReelDock project"}
          </div>
          <div className="text-fg-hint text-xs">{isEdited ? "Edited" : "Saved"}</div>
          {storageError ? <div className="text-warn-fg text-xs">{storageError}</div> : null}
          <div className="flex-1" />
          <Segmented
            className="w-[250px]"
            onChange={(value) => update({ ratio: toRatio(value) })}
            options={["16:9", "9:16", "1:1", "Custom"]}
            value={ratioLabel(doc.ratio)}
          />
          <IconButton aria-label="More">
            <ColorIcon icon={MoreVerticalIcon} size={16} tone="menu" />
          </IconButton>
          <Button
            leading={<ColorIcon icon={FolderExportIcon} size={15} tone="export" />}
            onClick={() => {
              setExportOpen(true);
              setExportState("idle");
            }}
            variant="bright"
          >
            Export
          </Button>
        </header>

        <div
          className="bg-well relative flex min-h-0 flex-1 items-center justify-center p-[26px_88px_26px_26px]"
          ref={ref}
        >
          <CanvasStage size={size} />
          <div className="border-raised-line bg-linear-to-b from-raised-top to-raised-alt-bottom shadow-popover absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-[15px] border p-1.5">
            {EDITOR_SECTIONS.map((item) => {
              const icon = sectionIcons[item.id];
              const on = section === item.id;

              return (
                <button
                  className={cn(
                    "rd-press grid min-h-[54px] w-[58px] cursor-pointer place-items-center rounded-[10px] border px-1.5 py-2 text-[9px] font-semibold",
                    on
                      ? "border-bright-line bg-linear-to-b from-bright-top to-bright-bottom text-on-bright shadow-bright"
                      : "text-fg-3 hover:text-fg border-transparent hover:bg-white/[5.5%]"
                  )}
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  type="button"
                >
                  <ColorIcon icon={icon} size={18} tone={sectionIconTones[item.id]} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="border-titlebar-line bg-titlebar flex h-44 flex-col gap-2.5 border-t px-5 py-3">
          <div className="flex items-center gap-2.5">
            <TransportButton onClick={() => setPlaying((value) => !value)}>
              <ColorIcon icon={playing ? PauseIcon : PlayIcon} size={15} tone="control" />
            </TransportButton>
            <Timecode>
              {timecode(time)}{" "}
              <span className="text-fg-key">/ {timecode(keptDuration(doc.segments))}</span>
            </Timecode>
            <Divider className="mx-1" orientation="vertical" />
            <ToolButton onClick={split}>Split</ToolButton>
            <ToolButton disabled={doc.segments.length < 2} onClick={remove}>
              Remove selection
            </ToolButton>
            <ToolButton disabled={!canUndo} onClick={undo}>
              Undo
            </ToolButton>
            <ToolButton disabled={!canRedo} onClick={redo}>
              Redo
            </ToolButton>
            <div className="flex-1" />
            <div className="text-fg-hint text-xs">{cutSummary}</div>
          </div>

          <div
            className="border-track-line bg-well shadow-well relative h-[92px] cursor-text overflow-hidden rounded-[9px] border"
            onPointerDown={scrub}
            ref={stripRef}
          >
            <div className="absolute inset-x-0 top-0 flex h-[50px] gap-px">
              {Array.from({ length: 24 }, (_, index) => (
                <div
                  className="bg-linear-to-b from-chip to-raised-bottom flex flex-1 items-center justify-center"
                  key={index}
                >
                  <div
                    className="h-[70%] w-[22%] rounded-sm"
                    style={{ background: FILMSTRIP_COLORS[index % FILMSTRIP_COLORS.length] }}
                  />
                </div>
              ))}
            </div>
            <div className="bg-window border-titlebar-line absolute inset-x-0 bottom-0 flex h-[42px] items-center gap-0.5 border-t px-1.5">
              {Array.from({ length: 90 }, (_, index) => (
                <div
                  className="bg-control-line-strong flex-1 rounded-[1px]"
                  key={index}
                  style={{ height: WAVEFORM_HEIGHTS[index % WAVEFORM_HEIGHTS.length] }}
                />
              ))}
            </div>
            {removed.map((region) => (
              <div
                className="border-dash-strong absolute inset-y-0 flex items-center justify-center border-x border-dashed bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-canvas)_86%,transparent)_0_6px,color-mix(in_oklab,var(--color-window)_86%,transparent)_6px_12px)]"
                key={`${region.start}-${region.width}`}
                style={{
                  left: percent(region.start, doc.dur),
                  width: percent(region.width, doc.dur),
                }}
              >
                <span className="font-ui-mono text-placeholder-fg text-[9.5px] uppercase tracking-[0.1em]">
                  removed
                </span>
              </div>
            ))}
            {doc.segments.map((segment, index) => (
              <button
                aria-label={`Segment ${index + 1}`}
                className={cn(
                  "absolute top-0 z-[2] h-full cursor-pointer rounded-[6px] border",
                  selectedSegment === index
                    ? "border-accent bg-accent/[11%]"
                    : "border-bright-top/10 bg-transparent"
                )}
                key={`${segment.start}-${segment.end}`}
                onClick={(event) => {
                  event.stopPropagation();
                  selectSegment(index);
                  setTime(Math.max(segment.start, Math.min(segment.end, time)));
                }}
                style={{
                  left: percent(segment.start, doc.dur),
                  width: percent(segment.end - segment.start, doc.dur),
                }}
                type="button"
              />
            ))}
            <div
              className="bg-fg pointer-events-none absolute inset-y-0 z-[3] w-0.5"
              style={{ left: percent(time, doc.dur) }}
            >
              <div className="bg-fg absolute -left-[5px] top-0 h-2 w-3 rounded-sm" />
            </div>
          </div>
        </footer>
      </div>

      <aside className="border-titlebar-line bg-titlebar flex w-80 flex-col gap-5 overflow-y-auto border-l px-5 py-5">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.012em]">{selectedSection.title}</h2>
          <p className="text-fg-3 mt-[5px] text-[12.5px] leading-[1.5]">{selectedSection.hint}</p>
        </div>

        {section === "layout" ? <LayoutGrid onChange={chooseLayout} value={doc.layout} /> : null}

        {section === "phone" ? (
          <div className="grid gap-4">
            <FieldSegmented<ElementSize>
              label="Size"
              onChange={(phoneSize) => update({ phoneSize })}
              options={ELEMENT_SIZES}
              value={doc.phoneSize}
            />
            <SwitchRow
              checked={doc.frame}
              label="Device frame"
              onChange={(frame) => update({ frame })}
            />
            <SwitchRow
              checked={doc.shadow}
              label="Shadow"
              onChange={(shadow) => update({ shadow })}
            />
            {LAYOUTS[doc.layout].swap ? (
              <SwitchRow
                checked={doc.swap}
                label="Swap sides"
                onChange={(swap) => update({ swap })}
              />
            ) : null}
            <Slider
              defaultValue={doc.radius}
              label="Corner radius"
              onChange={(radius) => update({ radius }, true)}
              value={doc.radius}
            />
            <Slider
              defaultValue={doc.zoom}
              label="Screen zoom"
              onChange={(zoom) => update({ zoom }, true)}
              value={doc.zoom}
            />
          </div>
        ) : null}

        {section === "camera" ? (
          <div className="grid gap-4">
            <SwitchRow
              checked={doc.camOn}
              label="Include camera"
              onChange={(camOn) => update({ camOn })}
            />
            {doc.camOn ? (
              <>
                {LAYOUTS[doc.layout].cam === "bubble" ? (
                  <FieldSegmented<CameraShape>
                    label="Shape"
                    onChange={(camShape) => update({ camShape })}
                    options={CAMERA_SHAPES.map((shape) => shape.id)}
                    value={doc.camShape}
                  />
                ) : null}
                <FieldSegmented<ElementSize>
                  label="Size"
                  onChange={(camSize) => update({ camSize })}
                  options={ELEMENT_SIZES}
                  value={doc.camSize}
                />
                {LAYOUTS[doc.layout].anchors ? (
                  <div>
                    <div className="text-fg-2 mb-2 text-[12.5px]">Position</div>
                    <div className="grid grid-cols-2 gap-2">
                      {CAMERA_ANCHORS.map((anchor) => (
                        <button
                          className={cn(
                            "rd-press border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row relative aspect-video rounded-[8px] border",
                            doc.camAnchor === anchor.id && "border-accent bg-accent/[12%]"
                          )}
                          key={anchor.id}
                          onClick={() => update({ camAnchor: anchor.id })}
                          type="button"
                        >
                          <span
                            className="bg-preview-camera absolute block h-[40%] w-[26%] rounded-full"
                            style={{ left: `${anchor.dx}%`, top: `${anchor.dy}%` }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <SwitchRow
                  checked={doc.mirror}
                  label="Mirror"
                  onChange={(mirror) => update({ mirror })}
                />
                <Slider
                  label="Crop position"
                  onChange={(crop) => update({ crop }, true)}
                  value={doc.crop}
                />
              </>
            ) : null}
          </div>
        ) : null}

        {section === "canvas" ? (
          <div className="grid gap-4">
            <FieldSegmented<CanvasRatio>
              label="Aspect ratio"
              onChange={(ratio) => update({ ratio })}
              options={CANVAS_RATIOS}
              value={doc.ratio}
            />
            {doc.ratio === "custom" ? (
              <SettingsList>
                <SettingsRow label="Width">
                  <Stepper
                    max={3840}
                    min={320}
                    onChange={(cw) => update({ cw })}
                    step={80}
                    value={doc.cw}
                  />
                </SettingsRow>
                <SettingsRow label="Height">
                  <Stepper
                    max={3840}
                    min={320}
                    onChange={(chh) => update({ chh })}
                    step={80}
                    value={doc.chh}
                  />
                </SettingsRow>
              </SettingsList>
            ) : (
              <div className="flex justify-between text-[12.5px]">
                <span className="text-fg-2">Exports at</span>
                <span className="font-ui-mono text-fg-value">{RATIO_RESOLUTIONS[doc.ratio]}</span>
              </div>
            )}
            <Divider />
            <FieldSegmented<BackgroundKind>
              label="Background"
              onChange={(bgKind) => update({ bgKind })}
              options={BACKGROUND_KINDS.map((kind) => kind.id)}
              value={doc.bgKind}
            />
            {doc.bgKind === "solid" ? (
              <div className="flex flex-wrap gap-2">
                {SOLID_BACKGROUNDS.map((swatch) => (
                  <Swatch
                    color={swatch.value}
                    key={swatch.label}
                    label={swatch.label}
                    onSelect={() => update({ bg: swatch.value, bgKind: "solid" })}
                    selected={doc.bg === swatch.value}
                  />
                ))}
              </div>
            ) : null}
            {doc.bgKind === "gradient" ? (
              <div className="grid grid-cols-2 gap-2">
                {GRADIENTS.map((gradient, index) => (
                  <Swatch
                    className="h-[46px] w-full"
                    color={gradient}
                    key={gradient}
                    onSelect={() => update({ grad: index, bgKind: "gradient" })}
                    selected={doc.grad === index}
                  />
                ))}
              </div>
            ) : null}
            {doc.bgKind === "pattern" ? (
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map((pattern, index) => (
                  <button
                    className={cn(
                      "rd-press border-swatch-line h-[46px] rounded-[8px] border",
                      doc.pat === index && "shadow-swatch"
                    )}
                    key={pattern.label}
                    onClick={() => update({ pat: index, bgKind: "pattern" })}
                    style={{ background: pattern.css }}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
            {doc.bgKind === "image" ? (
              <>
                <DropZone hint="png · jpg · heic">Drop an image</DropZone>
                <FieldSegmented<CanvasFit>
                  label="Fit"
                  onChange={(fit) => update({ fit })}
                  options={CANVAS_FITS.map((fit) => fit.id)}
                  value={doc.fit}
                />
              </>
            ) : null}
            <Slider
              label="Outer padding"
              onChange={(pad) => update({ pad }, true)}
              value={doc.pad}
            />
            {LAYOUTS[doc.layout].gap ? (
              <Slider label="Gap" onChange={(gap) => update({ gap }, true)} value={doc.gap} />
            ) : null}
          </div>
        ) : null}

        {section === "audio" ? (
          <div className="grid gap-4">
            <SwitchRow
              checked={doc.muted}
              label="Mute microphone"
              onChange={(muted) => update({ muted })}
            />
            <Slider label="Microphone" onChange={(mic) => update({ mic }, true)} value={doc.mic} />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-fg-2 flex items-center gap-1.5 text-[12.5px]">
                  Phone audio
                  <HelpBadge />
                </span>
                <span className="font-ui-mono text-fg-value text-[11.5px]">{doc.phoneVol}%</span>
              </div>
              <Slider
                label=""
                onChange={(phoneVol) => update({ phoneVol }, true)}
                tone="ok"
                value={doc.phoneVol}
              />
            </div>
          </div>
        ) : null}

        <div className="flex-1" />
        <SurfaceRow className="block">
          <p className="text-fg-3 text-xs leading-[1.5]">
            Every change is stored in <span className="font-ui-mono text-fg-2">project.json</span>.
            The recorded files are never rewritten.
          </p>
          <CodeBlock className="mt-2.5">{JSON.stringify(doc, null, 2)}</CodeBlock>
        </SurfaceRow>
      </aside>

      <Modal
        actions={
          exportState === "idle" ? (
            <>
              <Button
                leading={<ColorIcon icon={FolderExportIcon} size={16} tone="export" />}
                onClick={() => void startExport()}
                variant="bright"
              >
                Export video
              </Button>
              <Button onClick={() => setExportOpen(false)}>Cancel</Button>
              <div className="text-fg-hint ml-auto text-xs">Estimated 38 MB</div>
            </>
          ) : exportState === "running" ? (
            <Button onClick={() => setExportOpen(false)}>Cancel</Button>
          ) : (
            <>
              <Button onClick={() => setExportOpen(false)} variant="bright">
                Reveal in Finder
              </Button>
              <Button onClick={() => setExportOpen(false)}>Done</Button>
            </>
          )
        }
        onDismiss={() => setExportOpen(false)}
        open={exportOpen}
        subtitle="H.264 MP4, rendered on this Mac."
        title="Export"
      >
        {exportState === "idle" ? (
          <div className="px-7 pt-[22px]">
            <div className="text-fg-hint mb-3 text-[11px] font-semibold uppercase tracking-[0.11em]">
              Aspect ratio
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["16:9", "9:16", "1:1"] as const).map((ratio) => (
                <button
                  className={cn(
                    "rd-press border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row rounded-[10px] border p-3",
                    exportRatio === ratio && "border-accent bg-accent/[12%]"
                  )}
                  key={ratio}
                  onClick={() => setExportRatio(ratio)}
                  type="button"
                >
                  <span className="bg-well shadow-well mx-auto flex h-[132px] items-center justify-center rounded-[8px]">
                    <span
                      className="bg-screen relative block rounded"
                      style={{
                        width: ratio === "9:16" ? 54 : ratio === "1:1" ? 92 : 128,
                        height: ratio === "9:16" ? 120 : ratio === "1:1" ? 92 : 72,
                      }}
                    >
                      <span className="bg-window absolute left-[38%] top-[10%] h-[80%] w-[24%] rounded-[7px]" />
                      <span className="bg-camera-mini absolute bottom-[18%] right-[14%] size-[24%] rounded-full" />
                    </span>
                  </span>
                  <span className="mt-2.5 block text-[12.5px] font-semibold">{ratio}</span>
                  <span className="font-ui-mono text-fg-3 mt-[3px] block text-[11px]">
                    {RATIO_RESOLUTIONS[ratio]}
                  </span>
                </button>
              ))}
            </div>
            <SettingsList className="mt-[22px]">
              <SettingsRow label="Quality">
                <ValueChip>{EXPORT_QUALITY_LABEL}</ValueChip>
              </SettingsRow>
              <SettingsRow label="Frame rate">
                <ValueChip>60 fps</ValueChip>
              </SettingsRow>
              <SettingsRow label="Destination">
                <ValueChip>{REELDOCK_RECORDINGS_DIR}</ValueChip>
              </SettingsRow>
            </SettingsList>
          </div>
        ) : null}

        {exportState === "running" ? (
          <div className="px-7 pt-[30px]">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-fg-control flex items-center gap-2 text-sm">
                <ActivitySpinner size={16} />
                Rendering composition
              </span>
              <span className="font-ui-mono text-sm">{exportPct}%</span>
            </div>
            <ProgressBar value={exportPct} />
            <div className="text-fg-3 mt-3 text-[12.5px]">
              {exportPct < 35
                ? "Reading phone and camera tracks"
                : exportPct < 75
                  ? "Compositing layout and background"
                  : "Mixing audio and writing MP4"}
            </div>
          </div>
        ) : null}

        {exportState === "done" ? (
          <div className="px-7 pt-[30px]">
            <SurfaceRow tone="ok">
              <div>
                <div className="text-[15px] font-semibold">Export complete</div>
                <div className="font-ui-mono text-fg-2 mt-2 text-[12.5px]">
                  {exportJob?.filePath ?? `${REELDOCK_RECORDINGS_DIR}/export.mp4`}
                </div>
                <div className="text-fg-hint mt-1.5 text-[12.5px]">
                  {RATIO_RESOLUTIONS[exportRatio]} - {timecode(doc.dur)} - 37.4 MB
                </div>
              </div>
            </SurfaceRow>
          </div>
        ) : null}

        {exportState === "failed" ? (
          <div className="px-7 pt-[30px]">
            <SurfaceRow tone="rec">
              <div>
                <div className="text-[15px] font-semibold">Export stopped at 64%</div>
                <div className="text-fg-2 mt-2 text-[13px] leading-[1.55]">
                  The renderer ran out of space on Macintosh HD. Your recordings are untouched.
                </div>
              </div>
            </SurfaceRow>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}

type FieldSegmentedProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

function FieldSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: FieldSegmentedProps<T>) {
  const labels = options.map((option) => SIZE_LABELS[option as ElementSize] ?? option);
  const selectedLabel = SIZE_LABELS[value as ElementSize] ?? value;

  return (
    <div>
      <div className="text-fg-2 mb-2 text-[12.5px]">{label}</div>
      <Segmented
        onChange={(next) => {
          const index = labels.indexOf(next);
          onChange(options[index] ?? (next as T));
        }}
        options={labels}
        value={selectedLabel}
      />
    </div>
  );
}
