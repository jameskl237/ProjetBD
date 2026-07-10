import { mysqlTable, int, varchar, date, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { trimestreTable } from "./trimestre.ts";
import { personneTable } from "./personne.ts";
import { z } from "zod/v4";

export const sessionTable = mysqlTable("Session", {
  idSession: int("idSession").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  idTrimestre: int("idTrimestre").notNull(),
  idPers: int("idPers").notNull(),
  date_passage: date("date_passage"),
  created_at: datetime("created_at"),
});

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  trimestre: one(trimestreTable, { fields: [sessionTable.idTrimestre], references: [trimestreTable.idTrimes] }),
  personne: one(personneTable, { fields: [sessionTable.idPers], references: [personneTable.idPers] }),
}));

export const insertSessionSchema = createInsertSchema(sessionTable).omit({ idSession: true, created_at: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionTable.$inferSelect;
