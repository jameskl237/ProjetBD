import { mysqlTable, int, varchar, date, tinyint, smallint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { villeNaissanceTable } from "./ville_naissance.ts";
import { z } from "zod/v4";

export const eleveTable = mysqlTable("Eleve", {
  matricule: int("matricule").autoincrement().primaryKey(),
  nom: varchar("nom", { length: 60 }).notNull(),
  prenom: varchar("prenom", { length: 60 }).notNull(),
  dateNaissance: date("dateNaissance").notNull(),
  lieuNaissance: varchar("lieuNaissance", { length: 30 }).notNull(),
  sexe: smallint("sexe").notNull().default(0),
  langue: varchar("langue", { length: 30 }).notNull().default("NON DEFINI"),
  photoURL: varchar("photoURL", { length: 512 }),
  actif: tinyint("actif").notNull().default(0),
  idVilleNaissance: int("idVilleNaissance").notNull(),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const eleveRelations = relations(eleveTable, ({ one }) => ({
  ville: one(villeNaissanceTable, { fields: [eleveTable.idVilleNaissance], references: [villeNaissanceTable.idVille] }),
}));

export const insertEleveSchema = createInsertSchema(eleveTable, {
  dateNaissance: z.coerce.date(),
}).omit({ matricule: true, created_at: true, idAdmin: true });
export type InsertEleve = z.infer<typeof insertEleveSchema>;
export type Eleve = typeof eleveTable.$inferSelect;
