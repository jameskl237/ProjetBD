import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quartierTable = mysqlTable("Quartier", {
  idQuartier: int("idQuartier").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
});

export const insertQuartierSchema = createInsertSchema(quartierTable).omit({ idQuartier: true });
export type InsertQuartier = z.infer<typeof insertQuartierSchema>;
export type Quartier = typeof quartierTable.$inferSelect;
