import { defineConfig } from "drizzle-kit";

const gepUrl = process.env.GEP_DATABASE_URL ?? "";
const url =
  gepUrl.startsWith("mysql://") || gepUrl.startsWith("mysql2://")
    ? gepUrl
    : `mysql://${process.env.DB_USER ?? "ecole"}:${gepUrl || process.env.DB_PASSWORD}@${process.env.DB_HOST ?? "163.123.183.89"}:${process.env.DB_PORT ?? "17705"}/${process.env.DB_NAME ?? "ecole2026"}`;

export default defineConfig({
  dialect: "mysql",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dbCredentials: { url },
});
