import { create } from "zustand";
import { DEFAULT_DOC, projectDocSchema, type ProjectDoc } from "./types";

export type ActiveProject = {
  id: string;
  name: string;
  path: string;
  status: string;
  updatedAt: string;
};

type ProjectStore = {
  activeProject: ActiveProject | null;
  doc: ProjectDoc;
  past: ProjectDoc[];
  future: ProjectDoc[];
  selectedSegment: number;
  time: number;
  canUndo: boolean;
  canRedo: boolean;
  isEdited: boolean;
  loadProject: (project: ActiveProject & { doc: ProjectDoc }) => void;
  setActiveProject: (project: ActiveProject) => void;
  markSaved: (project?: ActiveProject) => void;
  update: (patch: Partial<ProjectDoc>, quiet?: boolean) => void;
  undo: () => void;
  redo: () => void;
  selectSegment: (index: number) => void;
  setTime: (time: number) => void;
};

const HISTORY_LIMIT = 60;

function sameValue<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateDoc(doc: ProjectDoc): ProjectDoc {
  return projectDocSchema.parse(doc);
}

export const useProject = create<ProjectStore>((set) => ({
  activeProject: null,
  doc: DEFAULT_DOC,
  past: [],
  future: [],
  selectedSegment: 0,
  time: 11.4,
  canUndo: false,
  canRedo: false,
  isEdited: false,
  loadProject: (project) =>
    set({
      activeProject: {
        id: project.id,
        name: project.name,
        path: project.path,
        status: project.status,
        updatedAt: project.updatedAt,
      },
      doc: validateDoc(project.doc),
      past: [],
      future: [],
      selectedSegment: 0,
      time: 0,
      canUndo: false,
      canRedo: false,
      isEdited: false,
    }),
  setActiveProject: (project) => set({ activeProject: project }),
  markSaved: (project) =>
    set((state) => ({
      activeProject: project ?? state.activeProject,
      isEdited: false,
    })),
  update: (patch, quiet = false) =>
    set((state) => {
      const changed = Object.keys(patch).some((key) => {
        const docKey = key as keyof ProjectDoc;
        return !sameValue(state.doc[docKey], patch[docKey]);
      });
      if (!changed) return state;

      const doc = validateDoc({ ...state.doc, ...patch });
      const past = quiet ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT);

      return {
        ...state,
        doc,
        past,
        future: quiet ? state.future : [],
        canUndo: past.length > 0,
        canRedo: quiet ? state.canRedo : false,
        isEdited: past.length > 0,
      };
    }),
  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) return state;
      const past = state.past.slice(0, -1);
      const future = [...state.future, state.doc];

      return {
        ...state,
        doc: previous,
        past,
        future,
        selectedSegment: 0,
        canUndo: past.length > 0,
        canRedo: true,
        isEdited: past.length > 0,
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future.at(-1);
      if (!next) return state;
      const future = state.future.slice(0, -1);
      const past = [...state.past, state.doc].slice(-HISTORY_LIMIT);

      return {
        ...state,
        doc: next,
        past,
        future,
        selectedSegment: 0,
        canUndo: true,
        canRedo: future.length > 0,
        isEdited: true,
      };
    }),
  selectSegment: (selectedSegment) => set({ selectedSegment }),
  setTime: (time) => set({ time }),
}));
