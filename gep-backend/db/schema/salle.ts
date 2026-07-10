import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { classeTable } from "./classe.ts";
import { z } from "zod/v4";

export const salleTable = mysqlTable("Salle", {
  idSalle: int("idSalle").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 30 }).notNull(),
  position: varchar("position", { length: 100 }).notNull().default(""),
  surface: varchar("surface", { length: 30 }).notNull().default(""),
  idClasse: int("idClasse"),
  actif: tinyint("actif").notNull().default(1),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  capacite: int("capacite"),
});

export const salleRelations = relations(salleTable, ({ one }) => ({
  classe: one(classeTable, { fields: [salleTable.idClasse], references: [classeTable.idClasse] }),
}));

export const insertSalleSchema = createInsertSchema(salleTable).omit({ idSalle: true, created_at: true, idAdmin: true });
export type InsertSalle = z.infer<typeof insertSalleSchema>;
export type Salle = typeof salleTable.$inferSelect;
