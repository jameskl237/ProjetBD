import { mysqlTable, int, text, date, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { eleveTable } from "./eleve.ts";
import { anneeAcademiqueTable } from "./annee_academique.ts";
import { personneTable } from "./personne.ts";
import { disciplineTable } from "./discipline.ts";
import { z } from "zod/v4";

export const rapportTable = mysqlTable("Rapport", {
  idRap: int("idRap").autoincrement().primaryKey(),
  matricule: int("matricule").notNull(),
  idAca: int("idAca").notNull(),
  commentaire: text("commentaire").notNull(),
  event_date: date("event_date").notNull(),
  idPers: int("idPers").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
  idDiscipline: int("idDiscipline"),
});

export const rapportRelations = relations(rapportTable, ({ one }) => ({
  eleve: one(eleveTable, { fields: [rapportTable.matricule], references: [eleveTable.matricule] }),
  annee: one(anneeAcademiqueTable, { fields: [rapportTable.idAca], references: [anneeAcademiqueTable.idAnnee] }),
  personne: one(personneTable, { fields: [rapportTable.idPers], references: [personneTable.idPers] }),
  discipline: one(disciplineTable, { fields: [rapportTable.idDiscipline], references: [disciplineTable.ID] }),
}));

export const insertRapportSchema = createInsertSchema(rapportTable).omit({ idRap: true, created_at: true });
export type InsertRapport = z.infer<typeof insertRapportSchema>;
export type Rapport = typeof rapportTable.$inferSelect;
