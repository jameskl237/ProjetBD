import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const modeTable = mysqlTable("Mode", {
  idMode: int("idMode").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 100 }).notNull(),
  information: varchar("information", { length: 255 }).notNull().default(""),
  actif: tinyint("actif").notNull().default(1),
  idFondateur: int("idFondateur").notNull(),
  created_at: datetime("created_at"),
});

export const insertModeSchema = createInsertSchema(modeTable).omit({ idMode: true, created_at: true });
export type InsertMode = z.infer<typeof insertModeSchema>;
export type Mode = typeof modeTable.$inferSelect;
