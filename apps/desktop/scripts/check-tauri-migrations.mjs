import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const journal = JSON.parse(
  readFileSync(join(root, "src/db/local/migrations/meta/_journal.json"), "utf8")
);
const main = readFileSync(join(root, "src-tauri/src/main.rs"), "utf8");

const missing = journal.entries.filter((entry) => {
  const file = `${entry.tag}.sql`;
  const version = `version: ${entry.idx + 1}`;
  return !main.includes(file) || !main.includes(version);
});

if (missing.length) {
  console.error("Tauri migration registration is missing generated Drizzle migrations:");
  for (const entry of missing) {
    console.error(`- version ${entry.idx + 1}: ${entry.tag}.sql`);
  }
  process.exit(1);
}
