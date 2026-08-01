import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CenterFocusIcon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Icon } from "@benrobo/iconary/react";
import {
  CANVAS_FITS,
  CANVAS_PADDING_MAX,
  CANVAS_PADDING_MIN,
  CANVAS_RATIOS,
  type CanvasFit,
  type CanvasRatio,
  RATIO_RESOLUTIONS,
} from "@reeldock/shared";
import {
  Button,
  cn,
  Divider,
  DropZone,
  IconButton,
  Popover,
  SettingsList,
  SettingsRow,
  Slider,
  Stepper,
  Swatch,
  ValueChip,
} from "@reeldock/ui";
import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useState } from "react";
import {
  BUILT_IN_BACKGROUND_GROUPS,
  backgroundCss,
  backgroundImageUrl,
  builtInBackgroundValue,
  IMAGE_PLACEHOLDER,
  normalizeSourceOrder,
  type SourceLayer,
} from "@/modules/project";
import { SOLID_BACKGROUNDS } from "../../data/editor-data";
import { FieldSegmented } from "../field-segmented";
import type { EditorSidebarSectionProps } from "./types";

export function CanvasSection({ doc, onUpdate }: EditorSidebarSectionProps) {
  return (
    <div className="grid gap-4">
      <CanvasRatioPicker value={doc.ratio} onChange={(ratio) => onUpdate({ ratio })} />
      {doc.ratio === "custom" ? (
        <SettingsList>
          <SettingsRow label="Width">
            <Stepper
              max={3840}
              min={320}
              onChange={(cw) => onUpdate({ cw })}
              step={80}
              value={doc.cw}
            />
          </SettingsRow>
          <SettingsRow label="Height">
            <Stepper
              max={3840}
              min={320}
              onChange={(chh) => onUpdate({ chh })}
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
      <BackgroundPicker doc={doc} onUpdate={onUpdate} />
      <SourceOrderSection
        order={doc.sourceOrder}
        onChange={(sourceOrder) => onUpdate({ sourceOrder })}
      />
      <Slider
        label="Outer padding"
        max={CANVAS_PADDING_MAX}
        min={CANVAS_PADDING_MIN}
        onChange={(pad) => onUpdate({ pad }, true)}
        value={doc.pad}
      />
      <Button
        className="w-full"
        leading={<Icon color="currentColor" icon={CenterFocusIcon} size={15} />}
        onClick={() => onUpdate(CENTERED_SOURCE_POSITIONS)}
        size="sm"
      >
        Re-center sources
      </Button>
    </div>
  );
}

const RATIO_PREVIEWS: Record<CanvasRatio, { label: string; w: number; h: number }> = {
  "16:9": { label: "16:9", w: 78, h: 44 },
  "9:16": { label: "9:16", w: 36, h: 64 },
  "1:1": { label: "1:1", w: 58, h: 58 },
  "4:5": { label: "4:5", w: 48, h: 60 },
  "5:4": { label: "5:4", w: 66, h: 53 },
  "4:3": { label: "4:3", w: 70, h: 53 },
  "3:4": { label: "3:4", w: 45, h: 60 },
  "21:9": { label: "21:9", w: 84, h: 36 },
  custom: { label: "Custom", w: 68, h: 50 },
};

const RATIO_PICKER_OPTIONS = CANVAS_RATIOS;

function CanvasRatioPicker({
  value,
  onChange,
}: {
  value: CanvasRatio;
  onChange: (ratio: CanvasRatio) => void;
}) {
  return (
    <div>
      <div className="text-fg-2 mb-3 text-[12.5px]">Aspect ratio</div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {RATIO_PICKER_OPTIONS.map((ratio) => {
          const preview = RATIO_PREVIEWS[ratio];
          const selected = value === ratio;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "rd-press group flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-[12px] font-medium",
                selected ? "text-fg" : "text-fg-3 hover:text-fg-control"
              )}
              key={ratio}
              onClick={() => onChange(ratio)}
              type="button"
            >
              <span className="flex h-16 w-full items-center justify-center">
                <span
                  className={cn(
                    "border-raised-line bg-control-bottom shadow-row block rounded-[8px] border transition-colors",
                    selected && "border-fg-control shadow-selected"
                  )}
                  style={{ width: preview.w, height: preview.h }}
                />
              </span>
              <span>{preview.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CENTERED_SOURCE_POSITIONS = {
  phoneX: null,
  phoneY: null,
  camX: null,
  camY: null,
} as const;

const SOURCE_LAYER_LABELS: Record<SourceLayer, string> = {
  phone: "Phone",
  camera: "Camera",
};

function SourceOrderSection({
  order,
  onChange,
}: {
  order?: readonly SourceLayer[];
  onChange: (order: SourceLayer[]) => void;
}) {
  const normalizedOrder = normalizeSourceOrder(order);
  const visibleOrder = [...normalizedOrder].reverse();

  const moveLayer = (layer: SourceLayer, direction: "backward" | "forward") => {
    const next = [...normalizedOrder];
    const index = next.indexOf(layer);
    const targetIndex = direction === "forward" ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-2">
      <div className="text-fg-2 text-[12.5px]">Order</div>
      <SettingsList>
        {visibleOrder.map((layer) => {
          const index = normalizedOrder.indexOf(layer);
          const isBack = index === 0;
          const isFront = index === normalizedOrder.length - 1;

          return (
            <SettingsRow
              className="px-3 py-2.5"
              hint={isFront ? "Front" : isBack ? "Back" : undefined}
              key={layer}
              label={SOURCE_LAYER_LABELS[layer]}
            >
              <div className="flex items-center gap-1">
                <IconButton
                  aria-label={`Send ${SOURCE_LAYER_LABELS[layer]} backward`}
                  className="size-7 rounded-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isBack}
                  onClick={() => moveLayer(layer, "backward")}
                >
                  <Icon color="currentColor" icon={ArrowDown01Icon} size={13} />
                </IconButton>
                <IconButton
                  aria-label={`Bring ${SOURCE_LAYER_LABELS[layer]} forward`}
                  className="size-7 rounded-[9px] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isFront}
                  onClick={() => moveLayer(layer, "forward")}
                >
                  <Icon color="currentColor" icon={ArrowUp01Icon} size={13} />
                </IconButton>
              </div>
            </SettingsRow>
          );
        })}
      </SettingsList>
    </div>
  );
}

type BackgroundGroupId = "solid" | "mesh" | "glass" | "custom";

type BackgroundSwatchOption = {
  label: string;
  css: string;
  selected: boolean;
  onSelect: () => void;
};

const COLLAPSED_SWATCH_COUNT = 4;
const CUSTOM_IMAGE_PLACEHOLDER_VALUE = builtInBackgroundValue("");

function BackgroundPicker({ doc, onUpdate }: EditorSidebarSectionProps) {
  const activeGroup = backgroundGroupForDoc(doc);
  const [expandedGroups, setExpandedGroups] = useState<Record<BackgroundGroupId, boolean>>(() => ({
    solid: activeGroup === "solid",
    mesh: activeGroup === "mesh",
    glass: activeGroup === "glass",
    custom: activeGroup === "custom",
  }));
  const selectedBackground = describeBackground(doc);
  const builtInSelection = findBuiltInBackground(doc.bg);

  useEffect(() => {
    setExpandedGroups((current) =>
      current[activeGroup] ? current : { ...current, [activeGroup]: true }
    );
  }, [activeGroup]);

  const toggleGroup = (group: BackgroundGroupId) => {
    setExpandedGroups((current) => ({ ...current, [group]: !current[group] }));
  };

  const useCustomImage = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      onUpdate({ bgKind: "image", bg: reader.result, fit: doc.fit || "cover" });
    });
    reader.readAsDataURL(file);
  };

  const handleCustomImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    useCustomImage(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  };

  const handleCustomImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    useCustomImage(event.dataTransfer.files?.[0]);
  };

  const builtInOptions = (groupId: "mesh" | "glass"): BackgroundSwatchOption[] => {
    const group = BUILT_IN_BACKGROUND_GROUPS.find((item) => item.id === groupId);
    if (!group) return [];

    return group.backgrounds.map((option) => {
      const value = builtInBackgroundValue(option.src);

      return {
        label: option.label,
        css: imageBackgroundCss(value, "cover"),
        selected: doc.bgKind === "image" && builtInSelection?.src === option.src,
        onSelect: () => onUpdate({ bgKind: "image", bg: value, fit: doc.fit || "cover" }),
      };
    });
  };

  const solidOptions = SOLID_BACKGROUNDS.map((swatch) => ({
    label: swatch.label,
    css: swatch.value,
    selected: doc.bgKind === "solid" && doc.bg === swatch.value,
    onSelect: () => onUpdate({ bg: swatch.value, bgKind: "solid" }),
  }));

  const customSelected = doc.bgKind === "image" && !builtInSelection;
  const customOptions = [
    {
      label: "Custom image",
      css: customSelected ? backgroundPreviewCss(doc) : IMAGE_PLACEHOLDER,
      selected: customSelected,
      onSelect: () =>
        onUpdate({ bgKind: "image", bg: CUSTOM_IMAGE_PLACEHOLDER_VALUE, fit: doc.fit || "cover" }),
    },
  ];

  const popoverContent = (
    <div className="max-h-[calc(100vh-48px)] w-[264px] overflow-y-auto p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <BackgroundSwatchGroup
        active={activeGroup === "solid"}
        expanded={expandedGroups.solid}
        options={solidOptions}
        title="Solid"
        onToggle={() => toggleGroup("solid")}
      />
      <BackgroundSwatchGroup
        active={activeGroup === "mesh"}
        expanded={expandedGroups.mesh}
        options={builtInOptions("mesh")}
        title="Mesh"
        onToggle={() => toggleGroup("mesh")}
      />
      <BackgroundSwatchGroup
        active={activeGroup === "glass"}
        expanded={expandedGroups.glass}
        options={builtInOptions("glass")}
        title="Glass"
        onToggle={() => toggleGroup("glass")}
      />
      <BackgroundSwatchGroup
        active={activeGroup === "custom"}
        expanded={expandedGroups.custom}
        options={customOptions}
        title="Custom image"
        onToggle={() => toggleGroup("custom")}
      >
        <div className="mt-3 grid gap-3">
          <label
            className="cursor-pointer"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleCustomImageDrop}
          >
            <input
              accept="image/png,image/jpeg,image/heic,image/webp"
              className="sr-only"
              onChange={handleCustomImageChange}
              type="file"
            />
            <DropZone className="h-[76px]" hint="png · jpg · heic · webp">
              {customSelected ? "Replace image" : "Choose image"}
            </DropZone>
          </label>
          <FieldSegmented<CanvasFit>
            label="Fit"
            onChange={(fit) => onUpdate({ fit })}
            options={CANVAS_FITS.map((fit) => fit.id)}
            value={doc.fit}
          />
        </div>
      </BackgroundSwatchGroup>
    </div>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-fg-2 text-[12.5px]">Background</span>
        <span className="font-ui-mono text-fg-faint text-[10px] uppercase tracking-[0.08em]">
          {selectedBackground.kind}
        </span>
      </div>
      <Popover className="rounded-[14px]" content={popoverContent} side="left">
        <ValueChip className="w-full px-2.5 py-2 text-left">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="border-swatch-line shadow-hairline-bright block h-8 w-11 shrink-0 rounded-[9px] border"
              style={{ background: backgroundPreviewCss(doc) }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-fg">
                {selectedBackground.label}
              </span>
              <span className="text-fg-faint block truncate text-[11px]">
                {selectedBackground.detail}
              </span>
            </span>
          </span>
        </ValueChip>
      </Popover>
    </div>
  );
}

function BackgroundSwatchGroup({
  active,
  title,
  expanded,
  options,
  children,
  onToggle,
}: {
  active: boolean;
  title: string;
  expanded: boolean;
  options: BackgroundSwatchOption[];
  children?: ReactNode;
  onToggle: () => void;
}) {
  const visibleOptions = expanded ? options : options.slice(0, COLLAPSED_SWATCH_COUNT);

  return (
    <section className="border-popover-line/70 border-b py-2.5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-fg text-[12.5px] font-semibold">{title}</span>
          {active ? (
            <span className="border-accent/40 bg-accent/[14%] text-accent-fg rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
              Active
            </span>
          ) : null}
        </div>
        <IconButton
          aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
          className="size-7 rounded-[9px]"
          onClick={onToggle}
          pressed={expanded}
        >
          <Icon color="currentColor" icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} size={13} />
        </IconButton>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {visibleOptions.map((option) => (
          <Swatch
            className="h-9 w-full rounded-[9px]"
            color={option.css}
            key={option.label}
            label={option.label}
            onSelect={option.onSelect}
            selected={option.selected}
          />
        ))}
      </div>
      {expanded ? children : null}
    </section>
  );
}

function backgroundPreviewCss(doc: EditorSidebarSectionProps["doc"]) {
  if (doc.bgKind !== "image") return backgroundCss(doc);
  return imageBackgroundCss(doc.bg, doc.fit);
}

function imageBackgroundCss(value: string, fit: CanvasFit) {
  const imageUrl = backgroundImageUrl(value);
  if (!imageUrl) return IMAGE_PLACEHOLDER;
  return `url("${imageUrl}") center / ${fit} no-repeat, var(--color-screen)`;
}

function findBuiltInBackground(value: string) {
  for (const group of BUILT_IN_BACKGROUND_GROUPS) {
    for (const option of group.backgrounds) {
      if (value === option.src || value === builtInBackgroundValue(option.src)) {
        return { group: group.id, label: option.label, src: option.src };
      }
    }
  }

  return null;
}

function backgroundGroupForDoc(doc: EditorSidebarSectionProps["doc"]): BackgroundGroupId {
  if (doc.bgKind === "solid") return "solid";
  if (doc.bgKind === "image") return findBuiltInBackground(doc.bg)?.group ?? "custom";
  if (doc.bgKind === "pattern") return "glass";
  return "mesh";
}

function describeBackground(doc: EditorSidebarSectionProps["doc"]) {
  if (doc.bgKind === "solid") {
    const selected = SOLID_BACKGROUNDS.find((swatch) => swatch.value === doc.bg);
    return { kind: "Solid", label: selected?.label ?? "Solid colour", detail: "Canvas fill" };
  }

  if (doc.bgKind === "image") {
    const selected = findBuiltInBackground(doc.bg);
    if (selected) {
      return {
        kind: selected.group === "mesh" ? "Mesh" : "Glass",
        label: selected.label,
        detail: `${selected.group === "mesh" ? "Mesh" : "Glass"} background`,
      };
    }

    return { kind: "Custom", label: "Custom image", detail: `${doc.fit || "cover"} fit` };
  }

  if (doc.bgKind === "pattern") {
    return { kind: "Glass", label: "Glass texture", detail: `Pattern ${doc.pat + 1}` };
  }

  return { kind: "Mesh", label: "Mesh gradient", detail: `Gradient ${doc.grad + 1}` };
}
