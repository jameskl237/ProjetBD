import { mysqlTable, int, varchar, float, date, timestamp, smallint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { specialiteTable } from "./specialite.ts";
import { z } from "zod/v4";

export const livreTable = mysqlTable("livre", {
  idLivre: int("idLivre").autoincrement().primaryKey(),
  titre: varchar("titre", { length: 255 }).notNull(),
  auteurs: varchar("auteurs", { length: 255 }),
  prix: float("prix"),
  idSpecialite: int("idSpecialite"),
  edition: varchar("edition", { length: 255 }),
  annee_parution: date("annee_parution"),
  idAdmin: int("idAdmin").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const livresTable = mysqlTable("Livres", {
  idLivre: int("idLivre").autoincrement().primaryKey(),
  titre: varchar("titre", { length: 255 }).notNull(),
  auteurs: varchar("auteurs", { length: 255 }).notNull().default(""),
  prix: float("prix").notNull().default(0),
  idSpecialite: int("idSpecialite").notNull(),
  edition: varchar("edition", { length: 255 }).notNull().default(""),
  annee_parution: date("annee_parution"),
  totalCopie: smallint("totalCopie").notNull().default(0),
  idAdmin: int("idAdmin").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const livreRelations = relations(livreTable, ({ one }) => ({
  specialite: one(specialiteTable, { fields: [livreTable.idSpecialite], references: [specialiteTable.idSpecialite] }),
}));

export const livresRelations = relations(livresTable, ({ one }) => ({
  specialite: one(specialiteTable, { fields: [livresTable.idSpecialite], references: [specialiteTable.idSpecialite] }),
}));

export const insertLivreSchema = createInsertSchema(livreTable).omit({ idLivre: true, created_at: true, idAdmin: true });
export type InsertLivre = z.infer<typeof insertLivreSchema>;
export type Livre = typeof livreTable.$inferSelect;

export const insertLivresSchema = createInsertSchema(livresTable).omit({ idLivre: true, created_at: true, idAdmin: true });
export type InsertLivres = z.infer<typeof insertLivresSchema>;
export type Livres = typeof livresTable.$inferSelect;
