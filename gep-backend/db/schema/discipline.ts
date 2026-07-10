import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disciplineTable = mysqlTable("Discipline", {
  ID: int("ID").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  points: int("points").notNull().default(0),
});

export const insertDisciplineSchema = createInsertSchema(disciplineTable).omit({ ID: true });
export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplineTable.$inferSelect;
