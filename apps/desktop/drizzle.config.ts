import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/local/schema.ts",
  out: "./src/db/local/migrations",
  dialect: "sqlite",
  verbose: true,
  strict: true,
});
