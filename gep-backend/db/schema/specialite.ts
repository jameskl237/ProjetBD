import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const specialiteTable = mysqlTable("Specialite", {
  idSpecialite: int("idSpecialite").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  idAdmin: int("idAdmin").notNull(),
});

export const insertSpecialiteSchema = createInsertSchema(specialiteTable).omit({ idSpecialite: true, idAdmin: true });
export type InsertSpecialite = z.infer<typeof insertSpecialiteSchema>;
export type Specialite = typeof specialiteTable.$inferSelect;
