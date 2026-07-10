import { mysqlTable, int, varchar, date, tinyint, smallint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const personneTable = mysqlTable("Personne", {
  idPers: int("idPers").autoincrement().primaryKey(),
  typePersonne: tinyint("typePersonne").notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  idAdmin: int("idAdmin").notNull(),
  created_at: datetime("created_at"),
  isDelete: tinyint("isDelete").default(0),
  sexe: smallint("sexe").default(0),
  photoURL: varchar("photoURL", { length: 255 }),
  email: varchar("email", { length: 255 }),
  login: varchar("login", { length: 100 }).unique(),
  actif: tinyint("actif").notNull().default(1),
  createdAt: datetime("createdAt"),
  updatedAt: datetime("updatedAt"),
  langue: varchar("langue", { length: 10 }).notNull().default("fr"),
  nom: varchar("nom", { length: 60 }),
  prenom: varchar("prenom", { length: 60 }),
  mobile: varchar("mobile", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  username: varchar("username", { length: 100 }),
  dateNaissance: date("dateNaissance"),
  lieuNaissance: varchar("lieuNaissance", { length: 60 }),
});

export const insertPersonneSchema = createInsertSchema(personneTable).omit({ idPers: true, created_at: true, createdAt: true, updatedAt: true, idAdmin: true });
export type InsertPersonne = z.infer<typeof insertPersonneSchema>;
export type Personne = typeof personneTable.$inferSelect;
