import { mysqlTable, int, varchar, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bulletinTable = mysqlTable("Bulletin", {
  idBulletin: int("idBulletin").autoincrement().primaryKey(),
  libelle: varchar("libelle", { length: 255 }).notNull(),
  etat: tinyint("etat").notNull().default(0),
  created_at: datetime("created_at"),
});

export const insertBulletinSchema = createInsertSchema(bulletinTable).omit({ idBulletin: true, created_at: true });
export type InsertBulletin = z.infer<typeof insertBulletinSchema>;
export type Bulletin = typeof bulletinTable.$inferSelect;
