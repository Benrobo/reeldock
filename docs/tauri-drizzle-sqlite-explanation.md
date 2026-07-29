# Tauri, Drizzle, and SQLite

This is the short version of how the desktop database works.

## The Simple Model

ReelDock has three parts involved in local storage:

```text
React UI
  -> Drizzle builds typed SQL queries
  -> Tauri SQL runs those queries against local SQLite
```

Drizzle does not store the database by itself. It gives us a typed TypeScript way to define tables and write SQL queries.

Tauri SQL is the runtime bridge that opens the actual SQLite database inside the desktop app.

SQLite is the local database file on disk.

## The Communication Layer

There are two main communication paths from React to the desktop app.

The first path is for database reads and writes:

```text
React service
  -> Drizzle query
  -> @tauri-apps/plugin-sql
  -> Rust Tauri SQL plugin
  -> SQLite file
```

Example:

```ts
const db = await localDb();
await db.insert(projects).values(project);
```

Plain English:

1. React calls a TypeScript service.
2. The service uses Drizzle.
3. Drizzle turns the TypeScript query into SQL.
4. The Tauri SQL plugin sends that SQL to the native side.
5. SQLite writes to `reeldock.db`.
6. The result comes back to React.

The second path is for native desktop actions that are not normal SQL:

```text
React
  -> invoke("command_name")
  -> registered Rust command
  -> macOS file/device/API work
  -> JSON result back to React
```

Example:

```ts
await invoke("write_project_document", {
  path,
  docJson: JSON.stringify(doc, null, 2),
});
```

Plain English:

1. React calls `invoke`.
2. Tauri finds the Rust command with that name.
3. Rust runs the native work.
4. Rust returns success or an error.
5. React updates the UI.

Use the SQL plugin for database work. Use Rust commands for native work like writing project files, detecting capture devices, recording, and exporting.

## Where The DB Lives

The app loads SQLite with:

```ts
Database.load("sqlite:reeldock.db")
```

Because that path is relative, Tauri stores it in the macOS app data folder:

```text
~/Library/Application Support/com.benrobo.reeldock/reeldock.db
```

That folder comes from the Tauri app identifier:

```json
"identifier": "com.benrobo.reeldock"
```

This is the right place for internal app state like recent projects, preferences, migration history, source track metadata, and export job records.

User-owned project folders and recordings should not live there. They should live in a visible project folder, for example:

```text
~/Movies/ReelDock/My Recording.reeldock/
```

## Drizzle's Job

Drizzle owns the schema in TypeScript:

```text
apps/desktop/src/db/local/schema.ts
```

When the schema changes, Drizzle Kit generates SQL migrations:

```sh
cd apps/desktop
bun run db:generate
```

Those migrations are written here:

```text
apps/desktop/src/db/local/migrations/
```

So the intended flow is:

```text
Drizzle schema
  -> generated SQL migration
  -> Tauri applies migration
  -> SQLite tables exist
```

## Tauri's Job

Tauri starts the desktop app and registers the SQL plugin.

Rust includes the generated migration file:

```rust
let migrations = vec![Migration {
    version: 1,
    description: "create_reeldock_local_tables",
    sql: include_str!("../../src/db/local/migrations/0000_initial_reeldock.sql"),
    kind: MigrationKind::Up,
}];
```

That does not mean Rust is designing the tables. The tables still come from Drizzle.

Rust is only telling Tauri:

```text
When this database opens, apply this generated SQL migration if needed.
```

## Why Rust Is Still Needed

ReelDock is a desktop app, not a normal browser app.

Rust/Tauri is needed for:

- opening local SQLite through the Tauri SQL plugin
- writing files like `.reeldock/project.json`
- later native iPhone, webcam, microphone, and export work

React handles UI. Rust handles desktop-native access.

## Why The Migration Error Happened

The error was:

```text
migration 1 was previously applied but has been modified
```

That means:

1. Tauri already applied migration version `1` to the local database.
2. The SQL text for migration version `1` changed afterward.
3. Tauri compared the old checksum with the new checksum.
4. They did not match, so Tauri stopped the app.

That is correct behavior.

Once a migration has been applied, do not edit it. Add a new migration instead.

For local development only, if the data does not matter, reset the dev DB:

```sh
cd apps/desktop
bun run db:reset-dev
```

That moves the old DB into:

```text
.context/dev-db-backups/
```

## What Belongs Where

Use SQLite for internal app data:

- recent projects
- preferences
- source track metadata
- export job records
- app status needed across restarts

Use project folders for user-owned files:

- `project.json`
- phone recordings
- webcam recordings
- microphone recordings
- thumbnails
- exported videos

Do not use `localStorage` as a fallback for data that belongs in SQLite. If SQLite is unavailable, the app should show an error instead of secretly saving somewhere else.

## Better Verification

Running a build only proves the code compiles and bundles.

It does not prove recording, capture, sync, or export works.

The better verification path is:

```text
type-check/lint/build
  + migration check
  + SQLite smoke test
  + Tauri startup test
  + project file write/read test
  + native capture test
  + export test
```

Current status: the DB wiring and build are working. Native capture and real export still need proper implementation.

For the fuller database explanation, see:

```text
docs/local-database.md
```
