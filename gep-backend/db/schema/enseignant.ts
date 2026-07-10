import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { personneTable } from "./personne.ts";
import { coursTable } from "./cours.ts";
import { z } from "zod/v4";

export const enseignantTable = mysqlTable("Enseignant", {
  idEnseignant: int("idEnseignant").autoincrement().primaryKey(),
  idPers: int("idPers").notNull(),
  idCours: int("idCours").notNull(),
  Actif: tinyint("Actif").notNull().default(1),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
  photoURL: varchar("photoURL", { length: 512 }),
});

export const enseignantRelations = relations(enseignantTable, ({ one }) => ({
  personne: one(personneTable, { fields: [enseignantTable.idPers], references: [personneTable.idPers] }),
  cours: one(coursTable, { fields: [enseignantTable.idCours], references: [coursTable.idCours] }),
}));

export const insertEnseignantSchema = createInsertSchema(enseignantTable).omit({ idEnseignant: true, created_at: true, idAdmin: true });
export type InsertEnseignant = z.infer<typeof insertEnseignantSchema>;
export type Enseignant = typeof enseignantTable.$inferSelect;
