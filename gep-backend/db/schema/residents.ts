import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { personneTable } from "./personne.ts";
import { quartierTable } from "./quartier.ts";
import { z } from "zod/v4";

export const residentsTable = mysqlTable("Residents", {
  idResi: int("idResi").autoincrement().primaryKey(),
  idPers: int("idPers").notNull(),
  idQuartier: int("idQuartier").notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
});

export const residentsRelations = relations(residentsTable, ({ one }) => ({
  personne: one(personneTable, { fields: [residentsTable.idPers], references: [personneTable.idPers] }),
  quartier: one(quartierTable, { fields: [residentsTable.idQuartier], references: [quartierTable.idQuartier] }),
}));

export const insertResidentsSchema = createInsertSchema(residentsTable).omit({ idResi: true, created_at: true, idAdmin: true });
export type InsertResidents = z.infer<typeof insertResidentsSchema>;
export type Residents = typeof residentsTable.$inferSelect;
