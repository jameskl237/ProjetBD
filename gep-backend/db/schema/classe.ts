import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { cycleTable } from "./cycle.ts";
import { z } from "zod/v4";

export const classeTable = mysqlTable("Classe", {
  idClasse: int("idClasse").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 100 }).notNull().default("INDEFINI"),
  idCycle: int("idCycle").notNull(),
  titulaire: int("titulaire"),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const classeRelations = relations(classeTable, ({ one }) => ({
  cycle: one(cycleTable, { fields: [classeTable.idCycle], references: [cycleTable.idCycle] }),
}));

export const insertClasseSchema = createInsertSchema(classeTable).omit({ idClasse: true, created_at: true, idAdmin: true });
export type InsertClasse = z.infer<typeof insertClasseSchema>;
export type Classe = typeof classeTable.$inferSelect;
