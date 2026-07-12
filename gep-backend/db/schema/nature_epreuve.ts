import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const natureEpreuveTable = mysqlTable("NatureEpreuve", {
  idNature: int("idNature").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  idAnnee: int("idAnnee"),
});

export const insertNatureEpreuveSchema = createInsertSchema(natureEpreuveTable).omit({ idNature: true });
export type InsertNatureEpreuve = z.infer<typeof insertNatureEpreuveSchema>;
export type NatureEpreuve = typeof natureEpreuveTable.$inferSelect;
