import { mysqlTable, int, tinyint, date, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { eleveTable } from "./eleve.ts";
import { z } from "zod/v4";

export const abonnementTable = mysqlTable("Abonnement", {
  idAbonnement: int("idAbonnement").autoincrement().primaryKey(),
  matricule: int("matricule").notNull(),
  type: tinyint("type").notNull().default(0),
  dateDebut: date("dateDebut").notNull(),
  dateFin: date("dateFin"),
  actif: tinyint("actif").notNull().default(1),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
});

export const abonnementRelations = relations(abonnementTable, ({ one }) => ({
  eleve: one(eleveTable, { fields: [abonnementTable.matricule], references: [eleveTable.matricule] }),
}));

export const insertAbonnementSchema = createInsertSchema(abonnementTable).omit({ idAbonnement: true, created_at: true, idAdmin: true });
export type InsertAbonnement = z.infer<typeof insertAbonnementSchema>;
export type Abonnement = typeof abonnementTable.$inferSelect;
