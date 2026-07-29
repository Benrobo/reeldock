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

export async function localDb() {
  const connection = await openSqlConnection();

  return drizzle(
    async (query, params, method) => {
      if (method === "run") {
        const result = await connection.execute(query, params);
        return { rows: [result] };
      }

      const rows = await connection.select<unknown[]>(query, params);
      return { rows: toArrayRows(rows) };
    },
    { schema }
  );
}
