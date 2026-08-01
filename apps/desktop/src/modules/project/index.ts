export { useProject, type ActiveProject } from "./store";
export {
  DEFAULT_DOC,
  DEFAULT_SOURCE_ORDER,
  SOURCE_LAYERS,
  normalizeSourceOrder,
  projectDocSchema,
  type ProjectDoc,
  type Segment,
  type SourceLayer,
} from "./types";
export {
  aspect,
  cameraFrame,
  compose,
  stageGeometry,
  type CameraFrame,
  type Placement,
  type StageGeometry,
} from "./lib/geometry";
export {
  BUILTIN_BACKGROUND_PREFIX,
  BUILT_IN_BACKGROUND_GROUPS,
  GRADIENTS,
  IMAGE_PLACEHOLDER,
  PATTERNS,
  backgroundCss,
  backgroundImageUrl,
  builtInBackgroundValue,
} from "./lib/background";
export {
  cutRegions,
  editedTime,
  keptDuration,
  nextTime,
  removeAt,
  snapTime,
  splitAt,
} from "./lib/timeline";
