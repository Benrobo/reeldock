# ReelDock Local Database

This explains the local database setup in simple terms.

## Where The Database Is Stored

In development on macOS, the ReelDock SQLite database is stored here:

```text
~/Library/Application Support/com.benrobo.reeldock/reeldock.db
```

The app identifier in `apps/desktop/src-tauri/tauri.conf.json` is:

```json
"identifier": "com.benrobo.reeldock"
```

That identifier is what Tauri uses for the app support folder.

There can also be SQLite sidecar files next to the main database:

```text
reeldock.db
reeldock.db-wal
reeldock.db-shm
```

Those sidecar files are normal SQLite files. They are used by SQLite's write-ahead log mode and should be treated as part of the local database while the app is running.

## What Is Stored In SQLite

SQLite is for local app records:

- recent projects
- project status
- project document JSON cache
- source track metadata
- export job metadata
- user preferences

The current tables are:

```text
projects
source_tracks
export_jobs
preferences
```

Tauri SQL also creates this internal migration table:

```text
_sqlx_migrations
```

That table tracks which migrations already ran and stores checksums so changed migrations can be detected.

## What Is Not Stored Only In SQLite

ReelDock projects should still exist as project folders.

A project folder should look roughly like this:

```text
My Recording.reeldock/
  project.json
  phone.mov
  webcam.mov
  microphone.mov
  phone-audio.m4a
  thumbnail.jpg
  exports/
```

SQLite is the app's local index and state store. The `.reeldock` folder is the portable project.

That means SQLite can help the app quickly list recent projects, but the project folder should remain understandable outside the app.

## The Current Flow

The database path is configured in three places, and all three point at the same database name:

```text
sqlite:reeldock.db
```

In Tauri config:

```json
"plugins": {
  "sql": {
    "preload": ["sqlite:reeldock.db"]
  }
}
```

In TypeScript:

```ts
export const DATABASE_PATH = "sqlite:reeldock.db";
```

In Rust:

```rust
.add_migrations("sqlite:reeldock.db", migrations)
```

Plain English:

1. Tauri starts the desktop app.
2. The SQL plugin opens `sqlite:reeldock.db`.
3. Tauri stores the actual file under the app support folder.
4. The SQL plugin runs any migrations that have not run yet.
5. React can then query SQLite through `@tauri-apps/plugin-sql`.
6. Drizzle builds the SQL queries in TypeScript.

## Drizzle's Job

Drizzle owns the database shape in TypeScript.

The schema lives here:

```text
apps/desktop/src/db/local/schema.ts
```

Drizzle Kit reads that schema and generates SQL migrations here:

```text
apps/desktop/src/db/local/migrations/
```

The command is:

```sh
bun run db:generate
```

Drizzle should be treated as the source of truth for tables, columns, indexes, and relationships.

## Tauri's Job

Tauri is not supposed to invent the tables by hand.

Tauri's job is to:

- open the local SQLite database inside the desktop runtime
- apply the SQL migration files generated from Drizzle
- expose the database safely to the React app through the SQL plugin

The current Rust code includes the generated SQL migration:

```rust
let migrations = vec![Migration {
    version: 1,
    description: "create_reeldock_local_tables",
    sql: include_str!("../../src/db/local/migrations/0000_initial_reeldock.sql"),
    kind: MigrationKind::Up,
}];
```

That means Rust is only registering generated SQL. It is not manually designing the schema.

## Why The Migration Panic Happened

The error was:

```text
migration 1 was previously applied but has been modified
```

That happened because Tauri SQL had already applied migration version `1` to the local development database.

After that, the SQL text for migration version `1` changed.

Tauri SQL stores a checksum for every migration it applies. When the app started again, it saw:

```text
stored checksum for migration 1 != current file checksum for migration 1
```

So it refused to continue.

That is correct behavior. Once a migration has been applied, it should be treated as immutable.

## How The Local Dev Database Was Fixed

The old local development database was moved to:

```text
.context/dev-db-backups/1785303919227-reeldock.db
```

Then Tauri created a fresh local database and applied the current migration cleanly.

There is also a helper script:

```sh
cd apps/desktop
bun run db:reset-dev
```

That moves the local dev database and its sidecar files into:

```text
.context/dev-db-backups/
```

It moves files instead of deleting them.

## What Should Happen When Schema Changes

Do not edit an already-applied migration file.

The safer flow is:

```text
change Drizzle schema
  -> run bun run db:generate
  -> commit the new migration file
  -> register the new migration version in Rust
  -> run bun run db:check-migrations
  -> test the app against a fresh dev database
```

For development only, if migration 1 was wrong and no real user data matters, it is okay to reset the local dev database.

For real releases, never rewrite an already-shipped migration. Add a new migration.

## Why There Is No LocalStorage Fallback

There should be no durable `localStorage` fallback for data that belongs in SQLite.

Client state is client state. Local database state is local database state.

If the app is running in a browser-only Vite preview, SQLite is not available. In that case the UI should show that local storage is unavailable instead of silently writing durable app data to `localStorage`.

That avoids a bad situation where:

- browser preview has one set of saved data
- desktop SQLite has another set of saved data
- the developer thinks the app is working when it is only working in a fake storage path

## What I Should Have Done Better

The better way to approach this would have been:

1. First decide and document the local persistence model.
2. Add the Drizzle schema.
3. Generate the first migration once.
4. Register that generated migration in Tauri.
5. Add a migration registration check immediately.
6. Add project and preference services against SQLite.
7. Verify database writes with a small runtime smoke test.
8. Only then wire the screens to those services.

That would have avoided changing migration 1 after it had already been applied locally.

## About Running Builds

Running builds proves only this:

- TypeScript compiles
- Vite can bundle the app
- Rust compiles
- Tauri can package the app

It does not prove that iPhone capture works.

It does not prove that webcam recording works.

It does not prove that microphone sync works.

It does not prove that MP4 export works.

For this app, builds are necessary but not enough.

The correct verification stack should be:

```text
format/type/lint/build
  + migration checks
  + SQLite smoke tests
  + Tauri startup test
  + native capture tests
  + project file write/read tests
  + export smoke tests
```

Right now, the local database setup and app build are working. Native capture and real export still need proper implementation and runtime tests.

## Better Long-Term Setup

A better long-term setup would be:

1. Keep Drizzle as the schema and query layer.
2. Keep SQLite as the local desktop database.
3. Keep Tauri SQL as the runtime SQLite bridge.
4. Add a small `db:migrate-register` script so Rust migration registration is generated or checked automatically.
5. Add `db:smoke` to create a project, save preferences, create an export job, and read everything back.
6. Add native Rust commands for capture and export instead of simulated UI-only flows.
7. Add a separate dev database option for tests so normal manual testing does not corrupt or depend on the real dev database.

That would make the setup easier to trust.

## References

- Drizzle schema docs: https://orm.drizzle.team/docs/sql-schema-declaration
- Drizzle Kit generate docs: https://orm.drizzle.team/docs/drizzle-kit-generate
- Tauri SQL plugin docs: https://v2.tauri.app/plugin/sql/
