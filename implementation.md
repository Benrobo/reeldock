# ReelDock Implementation

This build turns the desktop screens into a local-first app flow instead of static mock screens.

## Storage

ReelDock uses SQLite for durable desktop data. Projects, source tracks, export jobs, and preferences are written through services in `apps/desktop/src/services`. They do not fall back to `localStorage`.

The TypeScript Drizzle schema is the source of truth:

```ts
export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    docJson: text("doc_json").notNull(),
    lastOpenedAt: text("last_opened_at").notNull(),
  },
  (table) => [index("projects_last_opened_at_idx").on(table.lastOpenedAt)]
);
```

Drizzle Kit generates SQL migrations from that schema:

```sh
bun run db:generate
```

Tauri applies the generated SQL file at app startup:

```rust
Migration {
    version: 1,
    description: "create_reeldock_local_tables",
    sql: include_str!("../../src/db/local/migrations/0000_initial_reeldock.sql"),
    kind: MigrationKind::Up,
}
```

The browser Vite preview shows a storage-unavailable message because it is not the desktop runtime. The real Tauri app writes to `sqlite:reeldock.db`. There is no `localStorage` fallback for durable project, export, source-track, or preference data.

Migration drift is checked with:

```sh
bun run db:check-migrations
```

If a local dev database has a bad migration checksum from an earlier development run, reset it with:

```sh
bun run db:reset-dev
```

That command moves the database into `.context/dev-db-backups` instead of deleting it.

## App State

Zustand owns the active editor state and undo history. SQLite owns durable records.

```ts
const project = await projectsService.create({ sources });
useProject.getState().loadProject(project);
```

Screens read from Zustand for fast UI updates, then services persist meaningful changes to SQLite.

Project documents are also written into the `.reeldock` project folder through a Tauri command:

```ts
await projectFilesService.writeProjectDocument(project.path, project.doc);
```

## Recording Flow

Home opens setup. Setup creates the project row when recording starts, saves source-track choices, writes `project.json`, marks the project as `recording`, and opens the recording screen.

Recording tracks elapsed time. Stop saves the recorded duration and marks the project as `recorded`.

Editor autosaves layout edits to SQLite and creates export job rows when export starts.

Native iPhone capture and native MP4 rendering are still integration points. The current Rust source command does not fake available hardware; it reports unavailable or permission-required sources until real device detection is connected.

## Reusable Structure

Reusable app-wide values live outside feature modules:

```txt
apps/desktop/src/components/logo.tsx
apps/desktop/src/config/preferences.ts
apps/desktop/src/constants/paths.ts
apps/desktop/src/constants/recording.ts
apps/desktop/src/db/local
apps/desktop/src/services
```

Feature modules contain feature UI and local hooks only.

## Loaders

`ActivitySpinner` is shared through `@reeldock/ui` and used for loading buttons and panels. The UI does not use dot-only loading text for actions.

```tsx
<Button disabled={starting} leading={<ActivitySpinner size={16} />} variant="record">
  Record
</Button>
```

## Devtools

Storage devtools live in `@reeldock/devtools` so the UI can stay reusable. The desktop app supplies the storage adapter in `apps/desktop/src/modules/devtools/lib/storage-inspector.ts`.

The real SQLite database can only be managed inside Tauri because `@tauri-apps/plugin-sql` is a desktop bridge, not a browser API. Opening `http://127.0.0.1:1420/#/devtools` in a normal browser can manage `localStorage`, but it cannot open `sqlite:reeldock.db`.

The desktop app opens devtools in its own Tauri window:

```ts
const devtoolsWindow = new WebviewWindow("reeldock-devtools", {
  title: "ReelDock Devtools",
  url: "/#/devtools",
  width: 1180,
  height: 760,
});
```

That window label is included in the Tauri capability file so SQLite commands are allowed there too:

```json
{
  "windows": ["main", "reeldock-devtools"],
  "permissions": ["core:default", "sql:default", "sql:allow-execute"]
}
```

SQLite CRUD works through parameterized adapter methods. Select a table, turn on write mode, then use JSON to insert a row or select a row to update/delete it.

```ts
await adapter.sqliteInsert("preferences", {
  key: "onboardingRequirements",
  value: JSON.stringify(requirements),
});
```

Updates and deletes use the table primary key when one exists. If there is no primary key, the row editor uses SQLite `rowid`.

## Formatting

The repo uses Biome for formatting:

```sh
bun run format:check
bun run format
```
