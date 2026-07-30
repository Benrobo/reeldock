/**
 * Turn this on to show colored boxes around the preview areas.
 */
export const SETUP_PREVIEW_DEBUG = false;

/**
 * The phone preview should fill its phone box.
 */
export const DEVICE_PREVIEW_TARGET_SIZE = "100%";

/**
 * The webcam circle should sit a little inside its square box.
 */
export const WEBCAM_PREVIEW_TARGET_SIZE = "calc(100% - 16px)";

/**
 * These values move native previews down after React measures their boxes.
 */
export const NATIVE_PREVIEW_Y_OFFSETS: Record<string, number> = {
  phone: 32,
  webcam: 32,
};

/**
 * The phone preview corner roundness.
 */
export const LIVE_DEVICE_PREVIEW_RADIUS = 30;

/**
 * A large radius makes the webcam preview a circle.
 */
export const LIVE_WEBCAM_PREVIEW_RADIUS = 9999;

/**
 * The fallback portrait phone shape when the real device size is unknown.
 */
export const DEFAULT_PHONE_ASPECT = 390 / 844;

/**
 * How thick the optional phone border is. `0.012` means about 1.2% of the phone size.
 */
export const DEVICE_FRAME_BORDER_RATIO = 0.012;

/**
 * How round the phone screen corners are. `0.135` means about 13.5% of the phone size.
 */
export const DEVICE_SCREEN_RADIUS_RATIO = 0.135;
