import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { anneeAcademiqueTable } from "./annee_academique.ts";
import { z } from "zod/v4";

export const trimestreTable = mysqlTable("Trimestre", {
  idTrimes: int("idTrimes").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  periode: varchar("periode", { length: 255 }).notNull().default(""),
  idAca: int("idAca").notNull(),
  idAdmin: int("idAdmin").notNull(),
});

export const trimestreRelations = relations(trimestreTable, ({ one }) => ({
  annee: one(anneeAcademiqueTable, { fields: [trimestreTable.idAca], references: [anneeAcademiqueTable.idAnnee] }),
}));

export const insertTrimestreSchema = createInsertSchema(trimestreTable).omit({ idTrimes: true, idAdmin: true });
export type InsertTrimestre = z.infer<typeof insertTrimestreSchema>;
export type Trimestre = typeof trimestreTable.$inferSelect;
