import {
  Bug02Icon,
  CodeIcon,
  Database01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  Key01Icon,
  Refresh01Icon,
} from "@benrobo/iconary/core/duotone-rounded";
import { Icon } from "@benrobo/iconary/react";
import {
  ActivitySpinner,
  Banner,
  Button,
  cn,
  GroupLabel,
  Panel,
  Segmented,
  SurfaceRow,
  Switch,
  Tag,
  TextField,
} from "@reeldock/ui";
import { useEffect, useMemo, useState } from "react";
import type {
  DevtoolsStore,
  LocalStorageEntry,
  SqliteQueryResult,
  SqliteRowKey,
  SqliteRowsResult,
  SqliteTable,
  StorageDevtoolsAdapter,
} from "./types";

type StorageDevtoolsProps = {
  adapter: StorageDevtoolsAdapter;
  className?: string;
};

type StoreTone = "sqlite" | "local-storage";

const storeToneClass: Record<StoreTone, string> = {
  sqlite: "border-[#38bdf8]/30 bg-[#38bdf8]/12 text-[#38bdf8]",
  "local-storage": "border-[#c084fc]/30 bg-[#c084fc]/12 text-[#c084fc]",
};

export function StorageDevtools({ adapter, className }: StorageDevtoolsProps) {
  const stores = useMemo(() => adapter.stores(), [adapter]);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [writeMode, setWriteMode] = useState(false);
  const [tables, setTables] = useState<SqliteTable[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [rows, setRows] = useState<SqliteRowsResult | null>(null);
  const [queryResult, setQueryResult] = useState<SqliteQueryResult | null>(null);
  const [sqlText, setSqlText] = useState("SELECT name, type, sql FROM sqlite_master ORDER BY name");
  const [createDraft, setCreateDraft] = useState("{}");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [rowDraft, setRowDraft] = useState("{}");
  const [entries, setEntries] = useState<LocalStorageEntry[]>([]);
  const [entryKey, setEntryKey] = useState("");
  const [entryValue, setEntryValue] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0];

  useEffect(() => {
    if (!selectedStore) return;
    void refresh();
  }, [selectedStore?.id]);

  useEffect(() => {
    if (!selectedTable || selectedStore?.kind !== "sqlite") return;
    void loadRows(selectedTable, 0);
  }, [selectedTable, selectedStore?.kind]);

  async function refresh() {
    if (!selectedStore) return;
    setLoading(true);
    setError(null);
    try {
      if (selectedStore.kind === "sqlite") {
        const nextTables = await adapter.sqliteTables();
        setTables(nextTables);
        setSelectedTable((current) => current || nextTables[0]?.name || "");
      } else {
        setEntries(adapter.localStorageEntries());
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not refresh storage.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRows(table: string, offset: number) {
    setLoading(true);
    setError(null);
    try {
      setRows(await adapter.sqliteRows(table, 50, offset));
      setSelectedRowIndex(null);
      setRowDraft("{}");
    } catch (rowError) {
      setError(rowError instanceof Error ? rowError.message : "Could not load table rows.");
    } finally {
      setLoading(false);
    }
  }

  async function runSql() {
    setLoading(true);
    setError(null);
    try {
      setQueryResult(await adapter.sqliteQuery(sqlText, writeMode));
      await refresh();
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "Could not run SQL.");
    } finally {
      setLoading(false);
    }
  }

  async function createSqliteRow() {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);
    try {
      await adapter.sqliteInsert(
        selectedTable,
        stripInternalColumns(parseObjectDraft(createDraft)),
        writeMode
      );
      setCreateDraft("{}");
      await loadRows(selectedTable, rows?.offset ?? 0);
      await refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create row.");
    } finally {
      setLoading(false);
    }
  }

  async function updateSqliteRow() {
    if (!selectedTable || !rows || selectedRowIndex === null) return;
    const table = tables.find((item) => item.name === selectedTable);
    const row = rows.rows[selectedRowIndex];
    if (!table || !row) return;

    setLoading(true);
    setError(null);
    try {
      await adapter.sqliteUpdate(
        selectedTable,
        rowKey(table, row),
        parseObjectDraft(rowDraft),
        writeMode
      );
      await loadRows(selectedTable, rows.offset);
      await refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update row.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSqliteRow() {
    if (!selectedTable || !rows || selectedRowIndex === null) return;
    const table = tables.find((item) => item.name === selectedTable);
    const row = rows.rows[selectedRowIndex];
    if (!table || !row) return;

    setLoading(true);
    setError(null);
    try {
      await adapter.sqliteDelete(selectedTable, rowKey(table, row), writeMode);
      await loadRows(selectedTable, rows.offset);
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete row.");
    } finally {
      setLoading(false);
    }
  }

  function saveEntry() {
    if (!writeMode) {
      setError("Write mode is off.");
      return;
    }
    adapter.setLocalStorageEntry(entryKey, entryValue);
    setEntryKey("");
    setEntryValue("");
    setEntries(adapter.localStorageEntries());
    setError(null);
  }

  function deleteEntry(key: string) {
    if (!writeMode) {
      setError("Write mode is off.");
      return;
    }
    adapter.deleteLocalStorageEntry(key);
    setEntries(adapter.localStorageEntries());
    setError(null);
  }

  function clearEntries() {
    if (!writeMode) {
      setError("Write mode is off.");
      return;
    }
    adapter.clearLocalStorage();
    setEntries(adapter.localStorageEntries());
    setError(null);
  }

  return (
    <main className={cn("bg-window flex h-full min-w-0 flex-col", className)}>
      <header className="border-titlebar-line bg-titlebar flex h-[60px] items-center gap-4 border-b px-6">
        <IconBadge icon={Bug02Icon} tone="sqlite" />
        <div>
          <h1 className="text-[15px] font-semibold tracking-[-0.01em]">Storage devtools</h1>
          <p className="text-fg-3 mt-0.5 text-[12px]">
            Inspect SQLite and browser localStorage for this running app.
          </p>
        </div>
        <div className="flex-1" />
        <Switch checked={writeMode} label="Write mode" onChange={setWriteMode} />
        <Button
          leading={
            loading ? (
              <ActivitySpinner size={14} />
            ) : (
              <Icon color="currentColor" icon={Refresh01Icon} size={14} />
            )
          }
          onClick={() => void refresh()}
          size="mini"
        >
          Refresh
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-titlebar-line bg-titlebar flex min-h-0 flex-col gap-5 overflow-y-auto border-r p-5">
          <section>
            <GroupLabel className="mb-2.5">Stores</GroupLabel>
            <div className="flex flex-col gap-2">
              {stores.map((store) => (
                <button
                  className={cn(
                    "rd-press border-raised-line bg-linear-to-b from-raised-top to-raised-bottom shadow-row flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left",
                    store.id === selectedStore?.id ? "border-accent" : null
                  )}
                  key={store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                  type="button"
                >
                  <IconBadge
                    icon={store.kind === "sqlite" ? Database01Icon : Key01Icon}
                    tone={store.kind}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{store.label}</span>
                    <span className="text-fg-3 mt-px block text-[11.5px]">{store.id}</span>
                  </span>
                  <Tag>{store.writable ? "writeable" : "read-only"}</Tag>
                </button>
              ))}
            </div>
          </section>

          {selectedStore?.kind === "sqlite" ? (
            <section>
              <GroupLabel className="mb-2.5">Schema</GroupLabel>
              <div className="flex flex-col gap-2">
                {tables.map((table) => (
                  <button
                    className={cn(
                      "rd-press border-raised-line bg-surface flex cursor-pointer flex-col gap-1 rounded-[10px] border px-3 py-2.5 text-left",
                      table.name === selectedTable ? "border-accent" : null
                    )}
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    type="button"
                  >
                    <span className="text-[12.5px] font-semibold">{table.name}</span>
                    <span className="text-fg-3 text-[11.5px]">
                      {table.type} / {table.rowCount ?? "unknown"} rows
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <section className="min-h-0 overflow-y-auto p-6">
          {error ? (
            <Banner className="mb-4" tone="warn">
              {error}
            </Banner>
          ) : null}

          {!selectedStore ? (
            <Panel>No stores registered.</Panel>
          ) : selectedStore.kind === "sqlite" ? (
            <SqlitePanel
              loading={loading}
              onNext={() => rows && void loadRows(selectedTable, rows.offset + rows.limit)}
              onPrev={() =>
                rows && void loadRows(selectedTable, Math.max(0, rows.offset - rows.limit))
              }
              onCreate={() => void createSqliteRow()}
              onDelete={() => void deleteSqliteRow()}
              onRunSql={() => void runSql()}
              onSelectRow={(index) => {
                const row = rows?.rows[index];
                setSelectedRowIndex(index);
                setRowDraft(JSON.stringify(stripInternalColumns(row ?? {}), null, 2));
              }}
              onUpdate={() => void updateSqliteRow()}
              createDraft={createDraft}
              queryResult={queryResult}
              rowDraft={rowDraft}
              rows={rows}
              selectedRowIndex={selectedRowIndex}
              selectedTable={selectedTable}
              setCreateDraft={setCreateDraft}
              setRowDraft={setRowDraft}
              setSqlText={setSqlText}
              sqlText={sqlText}
              tables={tables}
              writeMode={writeMode}
            />
          ) : (
            <LocalStoragePanel
              entries={entries}
              entryKey={entryKey}
              entryValue={entryValue}
              filter={filter}
              onClear={clearEntries}
              onDelete={deleteEntry}
              onSave={saveEntry}
              setEntryKey={setEntryKey}
              setEntryValue={setEntryValue}
              setFilter={setFilter}
              writeMode={writeMode}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function SqlitePanel({
  createDraft,
  loading,
  onCreate,
  onDelete,
  onNext,
  onPrev,
  onRunSql,
  onSelectRow,
  onUpdate,
  queryResult,
  rowDraft,
  rows,
  selectedRowIndex,
  selectedTable,
  setCreateDraft,
  setRowDraft,
  setSqlText,
  sqlText,
  tables,
  writeMode,
}: {
  createDraft: string;
  loading: boolean;
  onCreate: () => void;
  onDelete: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRunSql: () => void;
  onSelectRow: (index: number) => void;
  onUpdate: () => void;
  queryResult: SqliteQueryResult | null;
  rowDraft: string;
  rows: SqliteRowsResult | null;
  selectedRowIndex: number | null;
  selectedTable: string;
  setCreateDraft: (value: string) => void;
  setRowDraft: (value: string) => void;
  setSqlText: (value: string) => void;
  sqlText: string;
  tables: SqliteTable[];
  writeMode: boolean;
}) {
  const table = tables.find((item) => item.name === selectedTable);
  const canMutateTable = table?.type === "table";

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <GroupLabel>Rows</GroupLabel>
            <h2 className="mt-1 text-[18px] font-semibold">
              {selectedTable || "No table selected"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Tag>{rows?.columns.length ?? 0} columns</Tag>
            <Tag>{rows?.rows.length ?? 0} visible</Tag>
          </div>
        </div>
        <DataTable
          columns={rows?.columns ?? []}
          onSelectRow={onSelectRow}
          rows={rows?.rows ?? []}
          selectedRowIndex={selectedRowIndex}
        />
        <div className="mt-4 flex items-center gap-2">
          <Button disabled={!rows || rows.offset === 0 || loading} onClick={onPrev} size="mini">
            Prev
          </Button>
          <Button disabled={!rows || loading} onClick={onNext} size="mini">
            Next
          </Button>
          <div className="text-fg-3 ml-auto text-[12px]">offset {rows?.offset ?? 0}</div>
        </div>
      </Panel>

      {table ? (
        <SurfaceRow className="block">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {table.columns.map((column) => (
              <Tag key={column.name}>
                {column.name}: {column.type ?? "unknown"}
                {column.primaryKey ? " pk" : ""}
              </Tag>
            ))}
          </div>
          <pre className="font-ui-mono text-fg-3 overflow-auto whitespace-pre-wrap text-[11.5px]">
            {table.sql}
          </pre>
        </SurfaceRow>
      ) : null}

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <GroupLabel>CRUD</GroupLabel>
            <p className="text-fg-3 mt-1 text-[12px]">
              Create rows from JSON, or select a row above to update/delete it.
            </p>
          </div>
          <Tag>{writeMode ? "write mode armed" : "read mode"}</Tag>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-fg-2 mb-2 text-[12px] font-semibold">Create row</div>
            <JsonTextarea onChange={setCreateDraft} value={createDraft} />
            <Button
              className="mt-3"
              disabled={!writeMode || !canMutateTable || loading}
              onClick={onCreate}
            >
              Insert row
            </Button>
          </div>
          <div>
            <div className="text-fg-2 mb-2 text-[12px] font-semibold">Selected row</div>
            <JsonTextarea
              disabled={selectedRowIndex === null}
              onChange={setRowDraft}
              value={rowDraft}
            />
            <div className="mt-3 flex gap-2">
              <Button
                disabled={!writeMode || !canMutateTable || selectedRowIndex === null || loading}
                onClick={onUpdate}
              >
                Update row
              </Button>
              <Button
                disabled={!writeMode || !canMutateTable || selectedRowIndex === null || loading}
                onClick={onDelete}
              >
                Delete row
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <GroupLabel>SQL Workbench</GroupLabel>
            <p className="text-fg-3 mt-1 text-[12px]">
              SELECT, PRAGMA, and EXPLAIN always run. Mutations require write mode.
            </p>
          </div>
          <Tag>{writeMode ? "write mode armed" : "read mode"}</Tag>
        </div>
        <textarea
          className="border-input-line bg-input font-ui-mono text-fg min-h-[128px] w-full resize-y rounded-[10px] border px-3 py-2.5 text-[12.5px] outline-none"
          onChange={(event) => setSqlText(event.target.value)}
          spellCheck={false}
          value={sqlText}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button
            leading={<Icon color="currentColor" icon={CodeIcon} size={14} />}
            onClick={onRunSql}
            variant="bright"
          >
            Run query
          </Button>
          <Button
            onClick={() => setSqlText(`SELECT * FROM ${selectedTable || "projects"} LIMIT 50`)}
            size="mini"
          >
            Select current table
          </Button>
          <Button
            onClick={() =>
              setSqlText(
                "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name"
              )
            }
            size="mini"
          >
            List schema
          </Button>
        </div>
        {queryResult ? (
          <div className="mt-4">
            {queryResult.kind === "rows" ? (
              <DataTable columns={queryResult.columns} rows={queryResult.rows} />
            ) : (
              <SurfaceRow>
                {queryResult.changes} changes / last insert {queryResult.lastInsertId ?? "n/a"}
              </SurfaceRow>
            )}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function LocalStoragePanel({
  entries,
  entryKey,
  entryValue,
  filter,
  onClear,
  onDelete,
  onSave,
  setEntryKey,
  setEntryValue,
  setFilter,
  writeMode,
}: {
  entries: LocalStorageEntry[];
  entryKey: string;
  entryValue: string;
  filter: string;
  onClear: () => void;
  onDelete: (key: string) => void;
  onSave: () => void;
  setEntryKey: (value: string) => void;
  setEntryValue: (value: string) => void;
  setFilter: (value: string) => void;
  writeMode: boolean;
}) {
  const filtered = entries.filter(
    (entry) =>
      !filter ||
      entry.key.toLowerCase().includes(filter.toLowerCase()) ||
      entry.value.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <GroupLabel>Browser localStorage</GroupLabel>
            <h2 className="mt-1 text-[18px] font-semibold">{entries.length} keys</h2>
          </div>
          <Button
            disabled={!writeMode || !entries.length}
            leading={<Icon color="currentColor" icon={Delete02Icon} size={14} />}
            onClick={onClear}
            size="mini"
          >
            Clear all
          </Button>
        </div>
        <TextField
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter keys or values"
          value={filter}
        />
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <GroupLabel>Set key</GroupLabel>
          <Tag>{writeMode ? "write mode armed" : "read mode"}</Tag>
        </div>
        <div className="grid grid-cols-[220px_minmax(0,1fr)_auto] gap-2">
          <TextField
            onChange={(event) => setEntryKey(event.target.value)}
            placeholder="key"
            value={entryKey}
          />
          <TextField
            onChange={(event) => setEntryValue(event.target.value)}
            placeholder="value"
            value={entryValue}
          />
          <Button
            disabled={!writeMode || !entryKey}
            leading={<Icon color="currentColor" icon={FloppyDiskIcon} size={14} />}
            onClick={onSave}
            variant="bright"
          >
            Save
          </Button>
        </div>
      </Panel>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <GroupLabel>Entries</GroupLabel>
          <Tag>{filtered.length} shown</Tag>
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <SurfaceRow className="items-start" key={entry.key}>
              <IconBadge icon={Key01Icon} tone="local-storage" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-ui-mono text-[12.5px] font-semibold">{entry.key}</span>
                  <Tag>{entry.json ? "json" : "string"}</Tag>
                  <Tag>{entry.size} chars</Tag>
                </div>
                <pre className="font-ui-mono text-fg-3 mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11.5px]">
                  {entry.preview}
                </pre>
              </div>
              <Button disabled={!writeMode} onClick={() => onDelete(entry.key)} size="mini">
                Delete
              </Button>
            </SurfaceRow>
          ))}
          {!filtered.length ? <div className="text-fg-3 text-sm">No localStorage keys.</div> : null}
        </div>
      </Panel>
    </div>
  );
}

function DataTable({
  columns,
  onSelectRow,
  rows,
  selectedRowIndex,
}: {
  columns: string[];
  onSelectRow?: (index: number) => void;
  rows: Record<string, unknown>[];
  selectedRowIndex?: number | null;
}) {
  if (!columns.length) {
    return <div className="text-fg-3 text-sm">No rows.</div>;
  }

  return (
    <div className="border-group-line max-h-[360px] overflow-auto rounded-[10px] border">
      <table className="w-full min-w-[720px] border-collapse text-left text-[12px]">
        <thead className="bg-titlebar sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                className="border-group-line text-fg-2 border-b px-3 py-2 font-semibold"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={cn(
                "border-group-line border-b last:border-b-0",
                onSelectRow ? "cursor-pointer hover:bg-white/[4%]" : null,
                selectedRowIndex === index ? "bg-accent/[10%]" : null
              )}
              key={index}
              onClick={onSelectRow ? () => onSelectRow(index) : undefined}
            >
              {columns.map((column) => (
                <td
                  className="font-ui-mono text-fg-3 max-w-[360px] truncate px-3 py-2"
                  key={column}
                >
                  {formatCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonTextarea({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <textarea
      className="border-input-line bg-input font-ui-mono text-fg min-h-[168px] w-full resize-y rounded-[10px] border px-3 py-2.5 text-[12.5px] outline-none disabled:opacity-45"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      value={value}
    />
  );
}

function IconBadge({ icon, tone }: { icon: Parameters<typeof Icon>[0]["icon"]; tone: StoreTone }) {
  return (
    <span
      className={cn(
        "grid size-[36px] shrink-0 place-items-center rounded-[11px] border",
        storeToneClass[tone]
      )}
    >
      <Icon color="currentColor" icon={icon} size={17} />
    </span>
  );
}

function formatCell(value: unknown) {
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseObjectDraft(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("CRUD JSON must be an object.");
  }
  return parsed as Record<string, unknown>;
}

function stripInternalColumns(row: Record<string, unknown>) {
  const next = { ...row };
  delete next.__rowid;
  return next;
}

function rowKey(table: SqliteTable, row: Record<string, unknown>): SqliteRowKey {
  const primaryKey = Object.fromEntries(
    table.columns
      .filter((column) => column.primaryKey)
      .map((column) => [column.name, row[column.name]])
  );

  if (Object.keys(primaryKey).length) return { primaryKey };
  return typeof row.__rowid === "number" ? { rowid: row.__rowid } : {};
}
