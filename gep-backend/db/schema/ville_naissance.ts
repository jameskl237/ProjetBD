import { mysqlTable, int, varchar, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const villeNaissanceTable = mysqlTable("VilleNaissance", {
  idVille: int("idVille").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 100 }).notNull().unique(),
  actif: tinyint("actif").notNull().default(1),
});

export const insertVilleNaissanceSchema = createInsertSchema(villeNaissanceTable).omit({ idVille: true });
export type InsertVilleNaissance = z.infer<typeof insertVilleNaissanceSchema>;
export type VilleNaissance = typeof villeNaissanceTable.$inferSelect;
