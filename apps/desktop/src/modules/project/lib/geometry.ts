import {
  CAMERA_SHAPES,
  CAMERA_SCALE_REFERENCE,
  PHONE_SCALE_DEFAULT,
  type CameraShape,
} from "@reeldock/shared";
import { DEFAULT_PHONE_ASPECT } from "@/constants/preview";
import type { ProjectDoc } from "../types";

const SIZE_INDEX = { S: 0, M: 1, L: 2 } as const;
const SETUP_CAMERA_HEIGHT_RATIO = 0.8;
const SETUP_CAMERA_GAP_RATIO = 0.055;

const CAMERA_ASPECT: Record<CameraShape, number> = Object.fromEntries(
  CAMERA_SHAPES.map((shape) => [shape.id, shape.aspect])
) as Record<CameraShape, number>;

function cameraAspect(shape: CameraShape) {
  return CAMERA_ASPECT[shape] ?? 16 / 9;
}

function cameraRadius(doc: ProjectDoc, width: number, height: number) {
  return Math.round((Math.min(width, height) / 2) * (doc.camRoundness / 100));
}

export type Placement = {
  phone: { x: number; y: number; h: number };
  cam: { x: number; y: number; w: number; h: number } | null;
};

export type CameraFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function aspect(doc: ProjectDoc): number {
  if (doc.ratio === "custom") return doc.cw / doc.chh;
  return {
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "1:1": 1,
    "4:5": 4 / 5,
    "5:4": 5 / 4,
    "4:3": 4 / 3,
    "3:4": 3 / 4,
    "21:9": 21 / 9,
  }[doc.ratio] ?? 16 / 9;
}

export function compose(doc: ProjectDoc, phoneAspect = DEFAULT_PHONE_ASPECT): Placement {
  const a = aspect(doc);
  const padY = doc.pad / 100;
  const padX = padY / a;
  const x0 = padX;
  const y0 = padY;
  const width = 1 - 2 * padX;
  const height = 1 - 2 * padY;
  const phoneIndex = SIZE_INDEX[doc.phoneSize];
  const camAspect = cameraAspect(doc.camShape);
  const phoneWidthFor = (h: number) => (h * phoneAspect) / a;
  const heightFactors = [0.8, 0.9, 1] as const;
  const phoneHeight = height * heightFactors[phoneIndex];
  const w = phoneWidthFor(phoneHeight);

  if (!doc.camOn) {
    return {
      phone: { x: x0 + (width - w) / 2, y: y0 + (height - phoneHeight) / 2, h: phoneHeight },
      cam: null,
    };
  }

  const camH = phoneHeight * SETUP_CAMERA_HEIGHT_RATIO;
  const camW = (camH * camAspect) / a;
  const gap = Math.min(width * SETUP_CAMERA_GAP_RATIO, 0.055);
  const groupWidth = w + gap + camW;

  if (groupWidth <= width) {
    const groupX = x0 + (width - groupWidth) / 2;
    const phone = { x: groupX, y: y0 + (height - phoneHeight) / 2, h: phoneHeight };
    return {
      phone,
      cam: {
        x: phone.x + w + gap,
        y: y0 + (height - camH) / 2,
        w: camW,
        h: camH,
      },
    };
  }

  const phone = { x: x0 + (width - w) / 2, y: y0 + (height - phoneHeight) / 2, h: phoneHeight };
  return {
    phone,
    cam: {
      x: x0 + width - camW,
      y: y0 + height - camH,
      w: camW,
      h: camH,
    },
  };
}

export function cameraFrame(
  doc: ProjectDoc,
  phoneAspect = DEFAULT_PHONE_ASPECT
): CameraFrame | null {
  const { cam } = compose(doc, phoneAspect);
  if (!cam) return null;

  const camScaleX = (doc.camScaleX ?? doc.camScale) / CAMERA_SCALE_REFERENCE;
  const camScaleY = (doc.camScaleY ?? doc.camScale) / CAMERA_SCALE_REFERENCE;
  const width = cam.w * camScaleX;
  const height = cam.h * camScaleY;

  return {
    x: doc.camX ?? cam.x + (cam.w - width) / 2,
    y: doc.camY ?? cam.y + (cam.h - height) / 2,
    w: width,
    h: height,
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

export function stageGeometry(
  doc: ProjectDoc,
  stage: { w: number; h: number },
  phoneAspect = DEFAULT_PHONE_ASPECT
): StageGeometry {
  const a = aspect(doc);
  const ch = Math.floor(Math.min(stage.h, stage.w / a));
  const cw = Math.round(ch * a);
  const { phone } = compose(doc, phoneAspect);
  const phoneScale = (doc.phoneScale ?? PHONE_SCALE_DEFAULT) / PHONE_SCALE_DEFAULT;
  const basePhoneWidth = (phone.h * phoneAspect) / a;
  const scaledPhoneWidth = basePhoneWidth * phoneScale;
  const scaledPhoneHeight = phone.h * phoneScale;
  const phoneX = doc.phoneX ?? phone.x + (basePhoneWidth - scaledPhoneWidth) / 2;
  const phoneY = doc.phoneY ?? phone.y + (phone.h - scaledPhoneHeight) / 2;
  const camera = cameraFrame(doc, phoneAspect);
  const camWidth = camera ? Math.round(camera.w * cw) : 0;
  const camHeight = camera ? Math.round(camera.h * ch) : 0;
  const camRadius = camera ? cameraRadius(doc, camWidth, camHeight) : 0;

  return {
    cw,
    ch,
    phoneLeft: Math.round(phoneX * cw),
    phoneTop: Math.round(phoneY * ch),
    phoneWidth: Math.round(scaledPhoneWidth * cw),
    phoneHeight: Math.round(scaledPhoneHeight * ch),
    hasCam: Boolean(camera),
    camLeft: camera ? Math.round(camera.x * cw) : 0,
    camTop: camera ? Math.round(camera.y * ch) : 0,
    camWidth,
    camHeight,
    camRadius,
  };
}
