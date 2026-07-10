import { mysqlTable, int, varchar, date, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const anneeAcademiqueTable = mysqlTable("AnneeAcademique", {
  idAnnee: int("idAnnee").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 200 }).notNull(),
  periode: varchar("periode", { length: 255 }).notNull().default(""),
  created_at: date("created_at").notNull(),
  idAdmin: int("idAdmin").notNull(),
  isDelete: tinyint("isDelete").default(0),
});

export const insertAnneeAcademiqueSchema = createInsertSchema(anneeAcademiqueTable).omit({ idAnnee: true, idAdmin: true });
export type InsertAnneeAcademique = z.infer<typeof insertAnneeAcademiqueSchema>;
export type AnneeAcademique = typeof anneeAcademiqueTable.$inferSelect;
