import { mysqlTable, int, varchar, float, tinyint, unique } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { scolariteTable } from "./scolarite.ts";
import { trimestreTable } from "./trimestre.ts";
import { z } from "zod/v4";

/**
 * Une tranche = 1/3 de la pension d'une classe (Scolarite), due sur un trimestre
 * donné. Générées automatiquement (montant figé au moment de la génération),
 * jamais saisies à la main — voir ensureTranchesForClasse.
 */
export const tranchesTable = mysqlTable("Tranches", {
  idTranche: int("idTranche").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  montant: float("montant").notNull(),
  delai_mois: int("delai_mois").notNull().default(1),
  delai_jour: int("delai_jour").notNull().default(15),
  idScolarite: int("idScolarite").notNull(),
  idTrimestre: int("idTrimestre").notNull(),
  actif: tinyint("actif").notNull().default(1),
  idFondateur: int("idFondateur").notNull(),
}, (table) => [unique("tranche_scolarite_trimestre_unique").on(table.idScolarite, table.idTrimestre)]);

export const tranchesRelations = relations(tranchesTable, ({ one }) => ({
  scolarite: one(scolariteTable, { fields: [tranchesTable.idScolarite], references: [scolariteTable.idScolarite] }),
  trimestre: one(trimestreTable, { fields: [tranchesTable.idTrimestre], references: [trimestreTable.idTrimes] }),
}));

export const insertTranchesSchema = createInsertSchema(tranchesTable).omit({ idTranche: true, idFondateur: true });
export type InsertTranches = z.infer<typeof insertTranchesSchema>;
export type Tranches = typeof tranchesTable.$inferSelect;
