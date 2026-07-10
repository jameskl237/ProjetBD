import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index.ts";

const gepUrl = process.env.GEP_DATABASE_URL ?? "";

let pool: mysql.Pool;

if (gepUrl.startsWith("mysql://") || gepUrl.startsWith("mysql2://")) {
  pool = mysql.createPool({ uri: gepUrl });
} else {
  const host = process.env.DB_HOST ?? "163.123.183.89";
  const port = parseInt(process.env.DB_PORT ?? "17705");
  const user = process.env.DB_USER ?? "ecole";
  const database = process.env.DB_NAME ?? "ecole2026";
  const password = gepUrl || (process.env.DB_PASSWORD ?? "");

  if (!password) {
    throw new Error("GEP_DATABASE_URL (password) ou DB_PASSWORD doit être défini.");
  }

  pool = mysql.createPool({ host, port, user, password, database });
}

export { pool };
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema/index.ts";
