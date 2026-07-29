export { useProject, type ActiveProject } from "./store";
export { LayoutGrid } from "./components/layout-grid";
export { DEFAULT_DOC, projectDocSchema, type ProjectDoc, type Segment } from "./types";
export { aspect, compose, stageGeometry, type Placement, type StageGeometry } from "./lib/geometry";
export { GRADIENTS, IMAGE_PLACEHOLDER, PATTERNS, backgroundCss } from "./lib/background";
export {
  cutRegions,
  editedTime,
  keptDuration,
  nextTime,
  removeAt,
  snapTime,
  splitAt,
} from "./lib/timeline";
