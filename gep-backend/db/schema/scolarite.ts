import { mysqlTable, int, float, varchar, datetime, unique } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { classeTable } from "./classe.ts";
import { z } from "zod/v4";

/**
 * Pension par classe : la classe porte déjà son cycle (filière), donc une ligne
 * Scolarite par idClasse couvre "dépend de la classe et du cycle". Toujours
 * scindée en 3 tranches (1 par trimestre) — voir Tranches.
 */
export const scolariteTable = mysqlTable("Scolarite", {
  idScolarite: int("idScolarite").autoincrement().primaryKey(),
  inscription: float("inscription").notNull(),
  pension: float("pension").notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  idClasse: int("idClasse").notNull(),
  idFondateur: int("idFondateur").notNull(),
  created_at: datetime("created_at"),
}, (table) => [unique("scolarite_classe_unique").on(table.idClasse)]);

export const scolariteRelations = relations(scolariteTable, ({ one }) => ({
  classe: one(classeTable, { fields: [scolariteTable.idClasse], references: [classeTable.idClasse] }),
}));

export const insertScolariteSchema = createInsertSchema(scolariteTable).omit({ idScolarite: true, created_at: true, idFondateur: true });
export type InsertScolarite = z.infer<typeof insertScolariteSchema>;
export type Scolarite = typeof scolariteTable.$inferSelect;
