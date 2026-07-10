import { mysqlTable, int, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { personneTable } from "./personne.ts";
import { salleTable } from "./salle.ts";
import { z } from "zod/v4";

export const titulaireTable = mysqlTable("Titulaire", {
  idTitulaire: int("idTitulaire").autoincrement().primaryKey(),
  idPers: int("idPers").notNull(),
  idSalle: int("idSalle").notNull(),
  actif: tinyint("actif").notNull().default(1),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
});

export const titulaireRelations = relations(titulaireTable, ({ one }) => ({
  personne: one(personneTable, { fields: [titulaireTable.idPers], references: [personneTable.idPers] }),
  salle: one(salleTable, { fields: [titulaireTable.idSalle], references: [salleTable.idSalle] }),
}));

export const insertTitulaireSchema = createInsertSchema(titulaireTable).omit({ idTitulaire: true, created_at: true, idAdmin: true });
export type InsertTitulaire = z.infer<typeof insertTitulaireSchema>;
export type Titulaire = typeof titulaireTable.$inferSelect;
