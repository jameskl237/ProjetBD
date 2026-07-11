import { mysqlTable, int, float, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Pension par cycle : chaque ligne définit les frais d'inscription,
 * le montant de la pension et le nombre de tranches pour un cycle donné.
 */
export const scolariteTable = mysqlTable("Scolarite", {
  idScolarite: int("idScolarite").autoincrement().primaryKey(),
  inscription: float("inscription").notNull(),
  pension: float("pension").notNull(),
  nbreTranche: int("nbreTranche").notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  idCycle: int("idCycle").notNull(),
  idFondateur: int("idFondateur").notNull(),
  created_at: datetime("created_at"),
});

export const insertScolariteSchema = createInsertSchema(scolariteTable).omit({ idScolarite: true, created_at: true, idFondateur: true });
export type InsertScolarite = z.infer<typeof insertScolariteSchema>;
export type Scolarite = typeof scolariteTable.$inferSelect;
