import { mysqlTable, int, float, varchar, date, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { eleveTable } from "./eleve.ts";
import { anneeAcademiqueTable } from "./annee_academique.ts";
import { modeTable } from "./mode.ts";
import { personneTable } from "./personne.ts";
import { z } from "zod/v4";

export const paiementTable = mysqlTable("Paiement", {
  idPaie: int("idPaie").autoincrement().primaryKey(),
  matricule: int("matricule").notNull(),
  idAca: int("idAca").notNull(),
  montant: float("montant").notNull(),
  url: varchar("url", { length: 255 }).notNull().default(""),
  comentaire: varchar("comentaire", { length: 255 }).notNull().default(""),
  idMode: int("idMode").notNull(),
  operation_ID: varchar("operation_ID", { length: 30 }).notNull().default(""),
  idPers: int("idPers").notNull(),
  datePaie: date("datePaie").notNull(),
  dateEnregistrer: datetime("dateEnregistrer").notNull(),
});

export const paiementRelations = relations(paiementTable, ({ one }) => ({
  eleve: one(eleveTable, { fields: [paiementTable.matricule], references: [eleveTable.matricule] }),
  annee: one(anneeAcademiqueTable, { fields: [paiementTable.idAca], references: [anneeAcademiqueTable.idAnnee] }),
  mode: one(modeTable, { fields: [paiementTable.idMode], references: [modeTable.idMode] }),
  personne: one(personneTable, { fields: [paiementTable.idPers], references: [personneTable.idPers] }),
}));

export const insertPaiementSchema = createInsertSchema(paiementTable).omit({ idPaie: true });
export type InsertPaiement = z.infer<typeof insertPaiementSchema>;
export type Paiement = typeof paiementTable.$inferSelect;
