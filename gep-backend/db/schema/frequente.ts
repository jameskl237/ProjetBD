import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { salleTable } from "./salle.ts";
import { anneeAcademiqueTable } from "./annee_academique.ts";
import { eleveTable } from "./eleve.ts";
import { z } from "zod/v4";

export const frequenteTable = mysqlTable("Frequente", {
  idFrequente: int("idFrequente").autoincrement().primaryKey(),
  idSalle: int("idSalle").notNull(),
  idAcademi: int("idAcademi").notNull(),
  matricule: int("matricule").notNull(),
  commentaire: varchar("commentaire", { length: 255 }).notNull().default(""),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
});

export const frequenteRelations = relations(frequenteTable, ({ one }) => ({
  salle: one(salleTable, { fields: [frequenteTable.idSalle], references: [salleTable.idSalle] }),
  annee: one(anneeAcademiqueTable, { fields: [frequenteTable.idAcademi], references: [anneeAcademiqueTable.idAnnee] }),
  eleve: one(eleveTable, { fields: [frequenteTable.matricule], references: [eleveTable.matricule] }),
}));

export const insertFrequenteSchema = createInsertSchema(frequenteTable).omit({ idFrequente: true, created_at: true, idAdmin: true });
export type InsertFrequente = z.infer<typeof insertFrequenteSchema>;
export type Frequente = typeof frequenteTable.$inferSelect;
