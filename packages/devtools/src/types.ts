export type DevtoolsStoreKind = "sqlite" | "local-storage";

export type DevtoolsStore = {
  id: string;
  label: string;
  kind: DevtoolsStoreKind;
  writable: boolean;
};

export type SqliteColumn = {
  name: string;
  type: string | null;
  nullable: boolean;
  primaryKey: boolean;
};

export type SqliteTable = {
  name: string;
  type: "table" | "view";
  sql: string | null;
  rowCount: number | null;
  columns: SqliteColumn[];
};

export type SqliteRowsResult = {
  rows: Record<string, unknown>[];
  columns: string[];
  limit: number;
  offset: number;
};

export type SqliteRowKey = {
  primaryKey?: Record<string, unknown>;
  rowid?: number;
};

export type SqliteQueryResult =
  | {
      kind: "rows";
      rows: Record<string, unknown>[];
      columns: string[];
      count: number;
    }
  | {
      kind: "result";
      changes: number;
      lastInsertId: number | null;
    };

export type LocalStorageEntry = {
  key: string;
  value: string;
  preview: string;
  size: number;
  json: boolean;
};

export type StorageDevtoolsAdapter = {
  stores: () => DevtoolsStore[];
  sqliteTables: () => Promise<SqliteTable[]>;
  sqliteRows: (table: string, limit: number, offset: number) => Promise<SqliteRowsResult>;
  sqliteQuery: (sql: string, write: boolean) => Promise<SqliteQueryResult>;
  sqliteInsert: (table: string, values: Record<string, unknown>, write: boolean) => Promise<void>;
  sqliteUpdate: (
    table: string,
    key: SqliteRowKey,
    values: Record<string, unknown>,
    write: boolean
  ) => Promise<void>;
  sqliteDelete: (table: string, key: SqliteRowKey, write: boolean) => Promise<void>;
  localStorageEntries: () => LocalStorageEntry[];
  setLocalStorageEntry: (key: string, value: string) => void;
  deleteLocalStorageEntry: (key: string) => void;
  clearLocalStorage: () => void;
};
