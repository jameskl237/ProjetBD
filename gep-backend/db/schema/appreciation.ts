import { mysqlTable, int, varchar, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appreciationTable = mysqlTable("Appreciation", {
  idAppreciation: int("idAppreciation").autoincrement().primaryKey(),
  grade: varchar("grade", { length: 10 }).notNull(),
  libelleFr: varchar("libelleFr", { length: 100 }).notNull(),
  libelleEn: varchar("libelleEn", { length: 100 }).notNull(),
  descriptionFr: varchar("descriptionFr", { length: 255 }),
  descriptionEn: varchar("descriptionEn", { length: 255 }),
  noteMin: int("noteMin").notNull(),
  noteMax: int("noteMax").notNull(),
  ordre: tinyint("ordre").notNull().default(0),
});

export const insertAppreciationSchema = createInsertSchema(appreciationTable).omit({ idAppreciation: true });
export type InsertAppreciation = z.infer<typeof insertAppreciationSchema>;
export type Appreciation = typeof appreciationTable.$inferSelect;
