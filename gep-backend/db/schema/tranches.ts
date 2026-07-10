import { mysqlTable, int, varchar, float, char, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { scolariteTable } from "./scolarite.ts";
import { z } from "zod/v4";

export const tranchesTable = mysqlTable("Tranches", {
  idTranche: int("idTranche").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  montant: float("montant").notNull(),
  delai_mois: char("delai_mois", { length: 2 }).notNull().default(""),
  delai_jour: char("delai_jour", { length: 2 }).notNull().default(""),
  idScolarite: int("idScolarite").notNull(),
  actif: tinyint("actif").notNull().default(1),
  idFondateur: int("idFondateur").notNull(),
});

export const tranchesRelations = relations(tranchesTable, ({ one }) => ({
  scolarite: one(scolariteTable, { fields: [tranchesTable.idScolarite], references: [scolariteTable.idScolarite] }),
}));

export const insertTranchesSchema = createInsertSchema(tranchesTable).omit({ idTranche: true, idFondateur: true });
export type InsertTranches = z.infer<typeof insertTranchesSchema>;
export type Tranches = typeof tranchesTable.$inferSelect;
