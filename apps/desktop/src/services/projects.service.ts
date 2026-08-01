import { desc, eq } from "drizzle-orm";
import type { CanvasRatio, CaptureSourceKind } from "@reeldock/shared";
import {
  createProjectWithSourcesTransaction,
  deleteProjectTransaction,
  localDb,
  projects,
  sourceTracks,
  exportJobs,
  type ProjectRow,
} from "@/db/local";
import { REELDOCK_RECORDINGS_DIR } from "@/constants/paths";
import { DEFAULT_PROJECT_NAME } from "@/constants/recording";
import { DEFAULT_DOC, projectDocSchema, type ProjectDoc } from "@/modules/project";
import { projectFilesService } from "./project-files.service";

const LEGACY_LAYOUT_ID = "freeform";

export type ProjectStatus = "draft" | "recording" | "recorded" | "exported" | "failed";

export type ProjectSummary = {
  id: string;
  name: string;
  path: string;
  durationSeconds: number;
  canvasRatio: string;
  status: ProjectStatus;
  doc: ProjectDoc;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
};

export type CreateProjectInput = {
  name?: string;
  sources: { kind: CaptureSourceKind; label: string; enabled: boolean }[];
};

export type ExportJobRecord = {
  id: string;
  projectId: string;
  ratio: CanvasRatio;
  filePath: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type SourceTrackRecord = {
  id: string;
  projectId: string;
  kind: CaptureSourceKind;
  label: string;
  filePath: string | null;
  state: "planned" | "recording" | "recorded" | "failed";
  enabled: boolean;
  startOffsetMs: number;
  durationMs: number;
  createdAt: string;
};

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pathFor(name: string, projectId: string) {
  return `${REELDOCK_RECORDINGS_DIR}/${slug(name)}-${projectId}.reeldock`;
}

function exportPathFor(project: ProjectSummary, jobId: string, ratio: CanvasRatio) {
  return `${project.path}/exports/${slug(project.name)}-${jobId}-${ratio.replace(":", "x")}.mp4`;
}

function fromRow(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    durationSeconds: row.durationSeconds,
    canvasRatio: row.canvasRatio,
    status: row.status as ProjectStatus,
    doc: projectDocSchema.parse(JSON.parse(row.docJson)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastOpenedAt: row.lastOpenedAt,
  };
}

function toRow(project: ProjectSummary) {
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    durationSeconds: project.durationSeconds,
    canvasRatio: project.canvasRatio,
    layoutId: LEGACY_LAYOUT_ID,
    status: project.status,
    docJson: JSON.stringify(project.doc),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastOpenedAt: project.lastOpenedAt,
  };
}

export const projectsService = {
  async list() {
    const db = await localDb();
    return (await db.select().from(projects).orderBy(desc(projects.lastOpenedAt))).map(fromRow);
  },

  async active() {
    return (await this.list())[0] ?? null;
  },

  async find(projectId: string) {
    const db = await localDb();
    const rows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    return rows[0] ? fromRow(rows[0]) : null;
  },

  async create(input: CreateProjectInput) {
    const timestamp = now();
    const name = input.name ?? DEFAULT_PROJECT_NAME;
    const projectId = id("project");
    const project: ProjectSummary = {
      id: projectId,
      name,
      path: pathFor(name, projectId),
      durationSeconds: DEFAULT_DOC.dur,
      canvasRatio: DEFAULT_DOC.ratio,
      status: "draft",
      doc: DEFAULT_DOC,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: timestamp,
    };

    await createProjectWithSourcesTransaction(
      toRow(project),
      input.sources.map((source) => ({
        id: id("source"),
        projectId: project.id,
        kind: source.kind,
        label: source.label,
        filePath: null,
        state: "planned",
        enabled: source.enabled,
        startOffsetMs: 0,
        durationMs: 0,
        createdAt: timestamp,
      }))
    );
    await projectFilesService.writeProjectDocument(project.path, project.doc);
    return project;
  },

  async duplicate(project: ProjectSummary) {
    const timestamp = now();
    const projectId = id("project");
    const copy: ProjectSummary = {
      ...project,
      id: projectId,
      name: `${project.name} copy`,
      path: pathFor(`${project.name} copy`, projectId),
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: timestamp,
    };
    const tracks = await this.listSourceTracks(project.id);

    await createProjectWithSourcesTransaction(
      toRow(copy),
      tracks.map((track) => ({
        id: id("source"),
        projectId: copy.id,
        kind: track.kind,
        label: track.label,
        filePath: track.filePath,
        state: track.state,
        enabled: track.enabled,
        startOffsetMs: track.startOffsetMs,
        durationMs: track.durationMs,
        createdAt: timestamp,
      }))
    );
    await projectFilesService.writeProjectDocument(copy.path, copy.doc);
    return copy;
  },

  async delete(projectId: string) {
    await deleteProjectTransaction(projectId);
  },

  async save(project: ProjectSummary) {
    const next = { ...project, updatedAt: now(), lastOpenedAt: now() };

    const db = await localDb();
    await db.update(projects).set(toRow(next)).where(eq(projects.id, next.id));
    await projectFilesService.writeProjectDocument(next.path, next.doc);
    return next;
  },

  async saveDoc(project: ProjectSummary, doc: ProjectDoc) {
    return this.save({
      ...project,
      durationSeconds: doc.dur,
      canvasRatio: doc.ratio,
      doc,
    });
  },

  async setStatus(project: ProjectSummary, status: ProjectStatus) {
    return this.save({ ...project, status });
  },

  async createExport(project: ProjectSummary, ratio: CanvasRatio) {
    const timestamp = now();
    const jobId = id("export");
    const job: ExportJobRecord = {
      id: jobId,
      projectId: project.id,
      ratio,
      filePath: exportPathFor(project, jobId, ratio),
      status: "running",
      progress: 0,
      error: null,
      createdAt: timestamp,
      completedAt: null,
    };

    const db = await localDb();
    await db.insert(exportJobs).values(job);
    return job;
  },

  async completeExport(job: ExportJobRecord) {
    const next: ExportJobRecord = {
      ...job,
      status: "done",
      progress: 100,
      completedAt: now(),
    };

    const db = await localDb();
    await db.update(exportJobs).set(next).where(eq(exportJobs.id, next.id));
    return next;
  },

  async failExport(job: ExportJobRecord, error: string) {
    const next: ExportJobRecord = {
      ...job,
      status: "failed",
      progress: 0,
      error,
      completedAt: now(),
    };

    const db = await localDb();
    await db.update(exportJobs).set(next).where(eq(exportJobs.id, next.id));
    return next;
  },

  async listSourceTracks(projectId: string): Promise<SourceTrackRecord[]> {
    const db = await localDb();
    const rows = await db.select().from(sourceTracks).where(eq(sourceTracks.projectId, projectId));
    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      kind: row.kind as CaptureSourceKind,
      label: row.label,
      filePath: row.filePath,
      state: row.state as SourceTrackRecord["state"],
      enabled: row.enabled,
      startOffsetMs: row.startOffsetMs,
      durationMs: row.durationMs,
      createdAt: row.createdAt,
    }));
  },

  async updateSourceTrack(
    trackId: string,
    patch: Partial<
      Pick<SourceTrackRecord, "filePath" | "state" | "enabled" | "startOffsetMs" | "durationMs">
    >
  ) {
    const db = await localDb();
    await db.update(sourceTracks).set(patch).where(eq(sourceTracks.id, trackId));
  },
};
