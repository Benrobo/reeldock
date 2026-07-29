import { existsSync, mkdirSync, renameSync } from "node:fs";
import { basename, join } from "node:path";

const dbPath = join(
  process.env.HOME ?? "",
  "Library/Application Support/com.benrobo.reeldock/reeldock.db"
);
const backupDir = join(process.cwd(), "../../.context/dev-db-backups");

const dbFiles = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].filter((path) => existsSync(path));

if (!dbFiles.length) {
  console.log("No ReelDock dev database found.");
  process.exit(0);
}

mkdirSync(backupDir, { recursive: true });
const stamp = Date.now();
for (const file of dbFiles) {
  const backupPath = join(backupDir, `${stamp}-${basename(file)}`);
  renameSync(file, backupPath);
  console.log(`Moved ${file} to ${backupPath}`);
}
