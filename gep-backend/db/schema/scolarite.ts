import { mysqlTable, int, float, smallint, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { cycleTable } from "./cycle.ts";
import { z } from "zod/v4";

export const scolariteTable = mysqlTable("Scolarite", {
  idScolarite: int("idScolarite").autoincrement().primaryKey(),
  inscription: float("inscription").notNull(),
  pension: float("pension").notNull(),
  nbreTranche: smallint("nbreTranche").notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  idCycle: int("idCycle").notNull(),
  idFondateur: int("idFondateur").notNull(),
  created_at: datetime("created_at"),
});

export const scolariteRelations = relations(scolariteTable, ({ one }) => ({
  cycle: one(cycleTable, { fields: [scolariteTable.idCycle], references: [cycleTable.idCycle] }),
}));

export const insertScolariteSchema = createInsertSchema(scolariteTable).omit({ idScolarite: true, created_at: true, idFondateur: true });
export type InsertScolarite = z.infer<typeof insertScolariteSchema>;
export type Scolarite = typeof scolariteTable.$inferSelect;
