import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminTable = mysqlTable("Admin", {
  ID: int("ID").autoincrement().primaryKey(),
  login: varchar("login", { length: 100 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  password: varchar("password", { length: 255 }).notNull(),
  typeAdmin: tinyint("typeAdmin").notNull(),
  actif: tinyint("actif").notNull().default(1),
  isDelete: tinyint("isDelete").notNull().default(0),
  createdAt: datetime("createdAt"),
  updatedAt: datetime("updatedAt"),
  langue: varchar("langue", { length: 10 }).notNull().default("fr"),
});

export const insertAdminSchema = createInsertSchema(adminTable).omit({ ID: true, createdAt: true, updatedAt: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof adminTable.$inferSelect;
