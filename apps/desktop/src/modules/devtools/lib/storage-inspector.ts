import type {
  DevtoolsStore,
  LocalStorageEntry,
  SqliteColumn,
  SqliteQueryResult,
  SqliteRowKey,
  SqliteRowsResult,
  SqliteTable,
} from "@reeldock/devtools";
import type SqlDatabase from "@tauri-apps/plugin-sql";
import { canUseLocalDb } from "@/db/local";
import { DATABASE_PATH } from "@/db/local/constants";

type SqliteMasterRow = {
  name: string;
  type: "table" | "view";
  sql: string | null;
};

type TableInfoRow = {
  name: string;
  type: string | null;
  notnull: number;
  pk: number;
};

type CountRow = {
  count: number;
};

type ExecuteResult = {
  rowsAffected?: number;
  lastInsertId?: number;
};

const sqliteStore: DevtoolsStore = {
  id: "sqlite.reeldock",
  label: "reeldock.db",
  kind: "sqlite",
  writable: true,
};

const browserSqliteStore: DevtoolsStore = {
  ...sqliteStore,
  label: "reeldock.db (Tauri only)",
  writable: false,
};

const localStorageStore: DevtoolsStore = {
  id: "browser.local-storage",
  label: "localStorage",
  kind: "local-storage",
  writable: true,
};

function currentStores(): DevtoolsStore[] {
  return canUseLocalDb()
    ? [sqliteStore, localStorageStore]
    : [localStorageStore, browserSqliteStore];
}

let sqlConnection: Promise<SqlDatabase> | null = null;

export const storageInspector = {
  stores(): DevtoolsStore[] {
    return currentStores();
  },

  async sqliteTables(): Promise<SqliteTable[]> {
    const db = await openSqlite();
    const rows = await db.select<SqliteMasterRow[]>(
      "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        rowCount: row.type === "table" ? await readCount(row.name) : null,
        columns: await readColumns(row.name),
      }))
    );
  },

  async sqliteRows(table: string, limit: number, offset: number): Promise<SqliteRowsResult> {
    const db = await openSqlite();
    const safeLimit = clamp(limit, 1, 500);
    const safeOffset = Math.max(0, offset);
    const rows = await db.select<Record<string, unknown>[]>(
      `SELECT rowid as __rowid, * FROM ${quoteIdentifier(table)} LIMIT ? OFFSET ?`,
      [safeLimit, safeOffset]
    );

    return {
      rows,
      columns: collectColumns(rows),
      limit: safeLimit,
      offset: safeOffset,
    };
  },

  async sqliteQuery(sql: string, write: boolean): Promise<SqliteQueryResult> {
    const db = await openSqlite();
    const trimmed = sql.trim();
    if (!trimmed) throw new Error("Enter a SQL statement first.");

    if (isReadSql(trimmed)) {
      const rows = await db.select<Record<string, unknown>[]>(trimmed);
      return {
        kind: "rows",
        rows,
        columns: collectColumns(rows),
        count: rows.length,
      };
    }

    if (!write) {
      throw new Error("Write mode is off.");
    }

    const result = await db.execute(trimmed);
    return {
      kind: "result",
      changes: normalizeExecuteResult(result).rowsAffected ?? 0,
      lastInsertId: normalizeExecuteResult(result).lastInsertId ?? null,
    };
  },

  async sqliteInsert(table: string, values: Record<string, unknown>, write: boolean) {
    if (!write) throw new Error("Write mode is off.");
    const db = await openSqlite();
    const entries = Object.entries(values).filter(([, value]) => typeof value !== "undefined");
    if (!entries.length) throw new Error("Enter at least one column value.");

    const columns = entries.map(([key]) => quoteIdentifier(key)).join(", ");
    const placeholders = entries.map(() => "?").join(", ");
    await db.execute(
      `INSERT INTO ${quoteIdentifier(table)} (${columns}) VALUES (${placeholders})`,
      [...entries.map(([, value]) => normalizeParam(value))]
    );
  },

  async sqliteUpdate(
    table: string,
    key: SqliteRowKey,
    values: Record<string, unknown>,
    write: boolean
  ) {
    if (!write) throw new Error("Write mode is off.");
    const db = await openSqlite();
    const entries = Object.entries(values).filter(([column]) => column !== "__rowid");
    if (!entries.length) throw new Error("Enter at least one column value.");

    const setSql = entries.map(([column]) => `${quoteIdentifier(column)} = ?`).join(", ");
    const where = whereClause(key);
    await db.execute(`UPDATE ${quoteIdentifier(table)} SET ${setSql} WHERE ${where.sql}`, [
      ...entries.map(([, value]) => normalizeParam(value)),
      ...where.params,
    ]);
  },

  async sqliteDelete(table: string, key: SqliteRowKey, write: boolean) {
    if (!write) throw new Error("Write mode is off.");
    const db = await openSqlite();
    const where = whereClause(key);
    await db.execute(`DELETE FROM ${quoteIdentifier(table)} WHERE ${where.sql}`, where.params);
  },

  localStorageEntries(): LocalStorageEntry[] {
    if (typeof window === "undefined") return [];

    return Object.keys(window.localStorage)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const value = window.localStorage.getItem(key) ?? "";
        return {
          key,
          value,
          preview: previewValue(value),
          size: value.length,
          json: isJson(value),
        };
      });
  },

  setLocalStorageEntry(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },

  deleteLocalStorageEntry(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },

  clearLocalStorage() {
    if (typeof window === "undefined") return;
    window.localStorage.clear();
  },
};

async function openSqlite() {
  if (!canUseLocalDb()) {
    throw new Error("SQLite devtools are only available inside the Tauri desktop runtime.");
  }

  const { default: SqlDatabase } = await import("@tauri-apps/plugin-sql");
  sqlConnection ??= SqlDatabase.load(DATABASE_PATH);
  return sqlConnection;
}

async function readCount(table: string): Promise<number | null> {
  try {
    const db = await openSqlite();
    const rows = await db.select<CountRow[]>(
      `SELECT COUNT(*) as count FROM ${quoteIdentifier(table)}`
    );
    return rows[0]?.count ?? null;
  } catch {
    return null;
  }
}

async function readColumns(table: string): Promise<SqliteColumn[]> {
  try {
    const db = await openSqlite();
    const rows = await db.select<TableInfoRow[]>(`PRAGMA table_info(${quoteIdentifier(table)})`);
    return rows.map((row) => ({
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0,
      primaryKey: row.pk > 0,
    }));
  } catch {
    return [];
  }
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function isReadSql(sql: string) {
  return /^(select|pragma|explain)\b/i.test(sql);
}

function collectColumns(rows: Record<string, unknown>[]) {
  const columns = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columns.add(key);
    }
  }
  return [...columns];
}

function isJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function previewValue(value: string) {
  if (!isJson(value)) return value;
  return JSON.stringify(JSON.parse(value), null, 2);
}

function normalizeExecuteResult(result: unknown): ExecuteResult {
  return result && typeof result === "object" ? (result as ExecuteResult) : {};
}

function normalizeParam(value: unknown) {
  if (typeof value === "undefined") return null;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return JSON.stringify(value);
}

function whereClause(key: SqliteRowKey) {
  const primaryEntries = Object.entries(key.primaryKey ?? {});
  if (primaryEntries.length) {
    return {
      sql: primaryEntries.map(([column]) => `${quoteIdentifier(column)} = ?`).join(" AND "),
      params: primaryEntries.map(([, value]) => normalizeParam(value)),
    };
  }

  if (typeof key.rowid === "number") {
    return { sql: "rowid = ?", params: [key.rowid] };
  }

  throw new Error("Cannot mutate this row because no primary key or rowid is available.");
}
