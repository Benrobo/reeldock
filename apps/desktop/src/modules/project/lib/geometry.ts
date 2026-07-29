import { LAYOUTS } from "@reeldock/shared";
import type { ProjectDoc } from "../types";

const SIZE_INDEX = { S: 0, M: 1, L: 2 } as const;
const PHONE_ASPECT = 390 / 844;

export type Placement = {
  phone: { x: number; y: number; h: number };
  cam: { x: number; y: number; w: number; h: number } | null;
};

export function aspect(doc: ProjectDoc): number {
  if (doc.ratio === "custom") return doc.cw / doc.chh;
  return { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1 }[doc.ratio] ?? 16 / 9;
}

export function compose(doc: ProjectDoc): Placement {
  const a = aspect(doc);
  const meta = LAYOUTS[doc.layout];
  const padY = doc.pad / 100;
  const padX = padY / a;
  const x0 = padX;
  const y0 = padY;
  const width = 1 - 2 * padX;
  const height = 1 - 2 * padY;
  const gapX = meta.gap ? doc.gap / 100 / a : 0;
  const phoneIndex = SIZE_INDEX[doc.phoneSize];
  const camIndex = SIZE_INDEX[doc.camSize];
  const phoneWidthFor = (h: number) => (h * PHONE_ASPECT) / a;

  if (doc.layout === "side") {
    const phoneHeight = height * [0.72, 0.86, 1][phoneIndex];
    const w = phoneWidthFor(phoneHeight);
    const camW = Math.max(0.12, width - w - gapX);
    const camH = (camW * a) / (16 / 9);
    return {
      phone: {
        x: doc.swap ? x0 + width - w : x0,
        y: y0 + (height - phoneHeight) / 2,
        h: phoneHeight,
      },
      cam: doc.camOn
        ? { x: doc.swap ? x0 : x0 + w + gapX, y: y0 + (height - camH) / 2, w: camW, h: camH }
        : null,
    };
  }

  if (doc.layout === "presenter") {
    const camW = width * [0.55, 0.63, 0.71][camIndex];
    const camH = (camW * a) / (16 / 9);
    const columnW = Math.max(0.1, width - camW - gapX);
    const phoneHeight = Math.min(
      height * [0.6, 0.74, 0.88][phoneIndex],
      (columnW * a) / PHONE_ASPECT
    );
    const w = phoneWidthFor(phoneHeight);
    const camX = doc.swap ? x0 + width - camW : x0;
    const columnX = doc.swap ? x0 : x0 + camW + gapX;
    return {
      phone: { x: columnX + (columnW - w) / 2, y: y0 + (height - phoneHeight) / 2, h: phoneHeight },
      cam: doc.camOn ? { x: camX, y: y0 + (height - camH) / 2, w: camW, h: camH } : null,
    };
  }

  const heightFactors =
    doc.layout === "pip"
      ? [0.8, 0.9, 1]
      : doc.layout === "vertical"
        ? [0.6, 0.72, 0.84]
        : [0.72, 0.86, 1];
  const phoneHeight = height * heightFactors[phoneIndex];
  const w = phoneWidthFor(phoneHeight);
  const phone = { x: x0 + (width - w) / 2, y: y0 + (height - phoneHeight) / 2, h: phoneHeight };

  if (!doc.camOn) return { phone, cam: null };

  const camFactors =
    doc.layout === "pip"
      ? [0.13, 0.17, 0.22]
      : doc.layout === "vertical"
        ? [0.18, 0.24, 0.3]
        : [0.1, 0.13, 0.17];
  const camW = width * camFactors[camIndex];
  const camH = (camW * a) / (doc.camShape === "circle" ? 1 : 16 / 9);
  const insetX = padX + 0.022;
  const insetY = padY + 0.022 * a;

  return {
    phone,
    cam: {
      x: doc.camAnchor[1] === "l" ? insetX : 1 - camW - insetX,
      y: doc.camAnchor[0] === "t" ? insetY : 1 - camH - insetY,
      w: camW,
      h: camH,
    },
  };
}

export type StageGeometry = {
  cw: number;
  ch: number;
  phoneLeft: number;
  phoneTop: number;
  phoneWidth: number;
  phoneHeight: number;
  camLeft: number;
  camTop: number;
  camWidth: number;
  camHeight: number;
  camRadius: number;
  hasCam: boolean;
};

export function stageGeometry(doc: ProjectDoc, stage: { w: number; h: number }): StageGeometry {
  const a = aspect(doc);
  const ch = Math.floor(Math.min(stage.h, stage.w / a));
  const cw = Math.round(ch * a);
  const { phone, cam } = compose(doc);
  const phoneHeight = phone.h * ch;
  const isBubble = LAYOUTS[doc.layout].cam === "bubble";

  return {
    cw,
    ch,
    phoneLeft: Math.round(phone.x * cw),
    phoneTop: Math.round(phone.y * ch),
    phoneWidth: Math.round(phoneHeight * PHONE_ASPECT),
    phoneHeight: Math.round(phoneHeight),
    hasCam: Boolean(cam),
    camLeft: cam ? Math.round(cam.x * cw) : 0,
    camTop: cam ? Math.round(cam.y * ch) : 0,
    camWidth: cam ? Math.round(cam.w * cw) : 0,
    camHeight: cam ? Math.round(cam.h * ch) : 0,
    camRadius: cam
      ? doc.camShape === "circle" && isBubble
        ? Math.round((cam.w * cw) / 2)
        : Math.round(cam.w * cw * 0.08)
      : 0,
  };
}
