import { mysqlTable, int, varchar, text, smallint, tinyint, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { personneTable } from "./personne.ts";
import { parentsTable } from "./parents.ts";
import { z } from "zod/v4";

export const messagesTable = mysqlTable("Messages", {
  idMessages: int("idMessages").autoincrement().primaryKey(),
  idExp_Pers: int("idExp_Pers").notNull(),
  senderRole: varchar("senderRole", { length: 30 }),
  senderId: varchar("senderId", { length: 120 }),
  senderLabel: varchar("senderLabel", { length: 160 }),
  receiverRole: varchar("receiverRole", { length: 30 }),
  receiverId: varchar("receiverId", { length: 120 }),
  receiverLabel: varchar("receiverLabel", { length: 160 }),
  idParent: int("idParent").notNull(),
  objet: varchar("objet", { length: 255 }).notNull().default(""),
  subject: varchar("subject", { length: 255 }).notNull().default(""),
  content: text("content"),
  information: text("information").notNull(),
  type_message: smallint("type_message").notNull().default(1),
  AnneeAcade: varchar("AnneeAcade", { length: 15 }).notNull().default(""),
  created_at: datetime("created_at"),
  valider: tinyint("valider").notNull().default(0),
  isRead: tinyint("isRead").notNull().default(0),
  readAt: datetime("readAt"),
  updated_at: datetime("updated_at").notNull(),
});

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  expediteur: one(personneTable, { fields: [messagesTable.idExp_Pers], references: [personneTable.idPers] }),
  parent: one(parentsTable, { fields: [messagesTable.idParent], references: [parentsTable.idParent] }),
}));

export const insertMessagesSchema = createInsertSchema(messagesTable).omit({ idMessages: true, created_at: true });
export type InsertMessages = z.infer<typeof insertMessagesSchema>;
export type Messages = typeof messagesTable.$inferSelect;
