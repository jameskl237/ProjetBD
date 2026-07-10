import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { classeTable } from "./classe.ts";
import { coursTable } from "./cours.ts";
import { salleTable } from "./salle.ts";
import { z } from "zod/v4";

export const emploiDuTempsTable = mysqlTable("EmploiDuTemps", {
  idTemps: int("idTemps").autoincrement().primaryKey(),
  jour: varchar("jour", { length: 30 }).notNull(),
  heure: varchar("heure", { length: 6 }).notNull(),
  idClasse: int("idClasse").notNull(),
  idCours: int("idCours").notNull(),
  idSalle: int("idSalle"),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
});

export const emploiDuTempsRelations = relations(emploiDuTempsTable, ({ one }) => ({
  classe: one(classeTable, { fields: [emploiDuTempsTable.idClasse], references: [classeTable.idClasse] }),
  cours: one(coursTable, { fields: [emploiDuTempsTable.idCours], references: [coursTable.idCours] }),
  salle: one(salleTable, { fields: [emploiDuTempsTable.idSalle], references: [salleTable.idSalle] }),
}));

export const insertEmploiDuTempsSchema = createInsertSchema(emploiDuTempsTable).omit({ idTemps: true, created_at: true, idAdmin: true });
export type InsertEmploiDuTemps = z.infer<typeof insertEmploiDuTempsSchema>;
export type EmploiDuTemps = typeof emploiDuTempsTable.$inferSelect;
