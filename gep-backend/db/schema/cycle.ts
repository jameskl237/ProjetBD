import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cycleTable = mysqlTable("Cycle", {
  idCycle: int("idCycle").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }).notNull().default(""),
  idAdmin: int("idAdmin").notNull(),
  created: datetime("created").notNull(),
  isDelete: tinyint("isDelete").default(0),
});

export const insertCycleSchema = createInsertSchema(cycleTable).omit({ idCycle: true, idAdmin: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type Cycle = typeof cycleTable.$inferSelect;
