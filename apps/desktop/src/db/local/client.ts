import type Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { DATABASE_PATH } from "./constants";
import { schema } from "./schema";

let sqlConnection: Promise<Database> | null = null;

export function canUseLocalDb() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function openSqlConnection() {
  if (!canUseLocalDb()) throw new Error("Local SQLite is only available in the Tauri runtime");
  const { default: SqlDatabase } = await import("@tauri-apps/plugin-sql");
  sqlConnection ??= SqlDatabase.load(DATABASE_PATH);
  return sqlConnection;
}

function toArrayRows(rows: unknown[]) {
  return rows.map((row) =>
    Array.isArray(row) ? row : Object.values(row as Record<string, unknown>)
  );
}

function firstSqlToken(query: string) {
  return (
    query
      .trim()
      .replace(/^(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/\s*)+/g, "")
      .trim()
      .match(/^[a-z]+/i)?.[0]
      .toLowerCase() ?? ""
  );
}

function isTransactionControlStatement(query: string) {
  return ["begin", "commit", "rollback", "savepoint", "release"].includes(firstSqlToken(query));
}

/**
 * @docs Local SQLite client boundary
 * @important Use this Drizzle/Tauri SQL proxy only for independent single-statement queries.
 *
 * Tauri SQL's JavaScript API executes through a sqlx pool. A transaction must stay on one backend
 * connection from BEGIN through COMMIT, but this proxy callback cannot hold that connection across
 * multiple frontend calls. That means `db.transaction(...)` can look correct in TypeScript while
 * still failing or rolling back incorrectly at runtime.
 *
 * Good fit:
 * `await db.select().from(projects)`
 * `await db.update(projects).set({ status: "recorded" }).where(eq(projects.id, projectId))`
 *
 * Do not use here:
 * `await db.transaction(async (tx) => { ... })`
 *
 * Proposed pattern for atomic workflows: create a typed Rust command that uses sqlx directly,
 * starts one native transaction, performs all dependent writes, commits, and is called once via
 * Tauri `invoke()`. Example: `create_project_with_sources` inserts the project and source tracks
 * together so the database cannot keep a partial project if one write fails.
 */
export async function localDb() {
  const connection = await openSqlConnection();

  return drizzle(
    async (query, params, method) => {
      if (isTransactionControlStatement(query)) {
        throw new Error(
          "Drizzle proxy transactions are not supported here. Put atomic multi-statement database work in a Rust sqlx Tauri command."
        );
      }

      if (method === "run") {
        await connection.execute(query, params);
        return { rows: [] };
      }

      const rows = await connection.select<unknown[]>(query, params);
      const arrayRows = toArrayRows(rows);
      return { rows: method === "get" ? (arrayRows[0] ?? []) : arrayRows };
    },
    { schema }
  );
}
