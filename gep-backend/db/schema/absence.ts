import { mysqlTable, int, date, tinyint, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { eleveTable } from "./eleve.ts";
import { coursTable } from "./cours.ts";
import { personneTable } from "./personne.ts";
import { anneeAcademiqueTable } from "./annee_academique.ts";
import { z } from "zod/v4";

export const absenceTable = mysqlTable("Absence", {
  idAbsence: int("idAbsence").autoincrement().primaryKey(),
  matricule: int("matricule").notNull(),
  idCours: int("idCours").notNull(),
  date: date("date").notNull(),
  justifiee: tinyint("justifiee").notNull().default(0),
  commentaire: varchar("commentaire", { length: 255 }).notNull().default(""),
  idPers: int("idPers").notNull(),
  idAca: int("idAca").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const absenceRelations = relations(absenceTable, ({ one }) => ({
  eleve: one(eleveTable, { fields: [absenceTable.matricule], references: [eleveTable.matricule] }),
  cours: one(coursTable, { fields: [absenceTable.idCours], references: [coursTable.idCours] }),
  personne: one(personneTable, { fields: [absenceTable.idPers], references: [personneTable.idPers] }),
  annee: one(anneeAcademiqueTable, { fields: [absenceTable.idAca], references: [anneeAcademiqueTable.idAnnee] }),
}));

export const insertAbsenceSchema = createInsertSchema(absenceTable).omit({ idAbsence: true, created_at: true });
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type Absence = typeof absenceTable.$inferSelect;
