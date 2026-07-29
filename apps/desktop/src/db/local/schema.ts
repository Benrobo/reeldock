import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    thumbnail: text("thumbnail"),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    canvasRatio: text("canvas_ratio").notNull(),
    layoutId: text("layout_id").notNull(),
    status: text("status").notNull(),
    docJson: text("doc_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    lastOpenedAt: text("last_opened_at").notNull(),
  },
  (table) => [index("projects_last_opened_at_idx").on(table.lastOpenedAt)]
);

export const sourceTracks = sqliteTable(
  "source_tracks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    filePath: text("file_path"),
    state: text("state").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    startOffsetMs: integer("start_offset_ms").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("source_tracks_project_id_idx").on(table.projectId)]
);

export const exportJobs = sqliteTable(
  "export_jobs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    ratio: text("ratio").notNull(),
    filePath: text("file_path").notNull(),
    status: text("status").notNull(),
    progress: integer("progress").notNull().default(0),
    error: text("error"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
  },
  (table) => [index("export_jobs_project_id_idx").on(table.projectId)]
);

export const preferences = sqliteTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const schema = {
  projects,
  sourceTracks,
  exportJobs,
  preferences,
};

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type SourceTrackRow = typeof sourceTracks.$inferSelect;
export type NewSourceTrackRow = typeof sourceTracks.$inferInsert;
export type ExportJobRow = typeof exportJobs.$inferSelect;
export type NewExportJobRow = typeof exportJobs.$inferInsert;
