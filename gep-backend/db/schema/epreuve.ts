import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { natureEpreuveTable } from "./nature_epreuve.ts";
import { personneTable } from "./personne.ts";
import { z } from "zod/v4";

export const epreuveTable = mysqlTable("Epreuve", {
  idEpreuve: int("idEpreuve").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  urlDoc: varchar("urlDoc", { length: 255 }).notNull().default(""),
  auteur: varchar("auteur", { length: 255 }).notNull().default(""),
  idNature: int("idNature").notNull(),
  idPers: int("idPers").notNull(),
  valider: tinyint("valider").notNull().default(0),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const epreuveRelations = relations(epreuveTable, ({ one }) => ({
  nature: one(natureEpreuveTable, { fields: [epreuveTable.idNature], references: [natureEpreuveTable.idNature] }),
  personne: one(personneTable, { fields: [epreuveTable.idPers], references: [personneTable.idPers] }),
}));

export const insertEpreuveSchema = createInsertSchema(epreuveTable).omit({ idEpreuve: true, created_at: true });
export type InsertEpreuve = z.infer<typeof insertEpreuveSchema>;
export type Epreuve = typeof epreuveTable.$inferSelect;
