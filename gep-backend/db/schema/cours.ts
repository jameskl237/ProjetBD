import { mysqlTable, int, varchar, float, tinyint, datetime, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { classeTable } from "./classe.ts";
import { z } from "zod/v4";

export const coursTable = mysqlTable("Cours", {
  idCours: int("idCours").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  coefficient: float("coefficient").notNull().default(1),
  description: text("description").notNull(),
  idClasse: int("idClasse").notNull(),
  actif: tinyint("actif").notNull().default(1),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
  note: float("note"),
  idEnseignant: int("idEnseignant"),
  heures: int("heures"),
  idSalle: int("idSalle"),
});

export const coursRelations = relations(coursTable, ({ one }) => ({
  classe: one(classeTable, { fields: [coursTable.idClasse], references: [classeTable.idClasse] }),
}));

export const insertCoursSchema = createInsertSchema(coursTable).omit({ idCours: true, created_at: true, idAdmin: true });
export type InsertCours = z.infer<typeof insertCoursSchema>;
export type Cours = typeof coursTable.$inferSelect;
