import { mysqlTable, int, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { personneTable } from "./personne.ts";
import { eleveTable } from "./eleve.ts";
import { z } from "zod/v4";

export const parentsTable = mysqlTable("Parents", {
  idParent: int("idParent").autoincrement().primaryKey(),
  idPers: int("idPers").notNull(),
  matricule: int("matricule").notNull(),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const parentsRelations = relations(parentsTable, ({ one }) => ({
  personne: one(personneTable, { fields: [parentsTable.idPers], references: [personneTable.idPers] }),
  eleve: one(eleveTable, { fields: [parentsTable.matricule], references: [eleveTable.matricule] }),
}));

export const insertParentsSchema = createInsertSchema(parentsTable).omit({ idParent: true, created_at: true, idAdmin: true });
export type InsertParents = z.infer<typeof insertParentsSchema>;
export type Parents = typeof parentsTable.$inferSelect;
