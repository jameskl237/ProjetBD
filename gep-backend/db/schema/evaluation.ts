import { mysqlTable, int, float, varchar, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { eleveTable } from "./eleve.ts";
import { epreuveTable } from "./epreuve.ts";
import { coursTable } from "./cours.ts";
import { sessionTable } from "./session.ts";
import { personneTable } from "./personne.ts";
import { z } from "zod/v4";

export const evaluationTable = mysqlTable("Evaluation", {
  idEval: int("idEval").autoincrement().primaryKey(),
  note: float("note").notNull().default(0),
  appreciation: varchar("appreciation", { length: 255 }).notNull().default(""),
  matricule: int("matricule").notNull(),
  idEpreuve: int("idEpreuve").notNull(),
  idCours: int("idCours").notNull(),
  idSession: int("idSession").notNull(),
  idPers: int("idPers").notNull(),
  created_at: datetime("created_at"),
});

export const evaluationRelations = relations(evaluationTable, ({ one }) => ({
  eleve: one(eleveTable, { fields: [evaluationTable.matricule], references: [eleveTable.matricule] }),
  epreuve: one(epreuveTable, { fields: [evaluationTable.idEpreuve], references: [epreuveTable.idEpreuve] }),
  cours: one(coursTable, { fields: [evaluationTable.idCours], references: [coursTable.idCours] }),
  session: one(sessionTable, { fields: [evaluationTable.idSession], references: [sessionTable.idSession] }),
  personne: one(personneTable, { fields: [evaluationTable.idPers], references: [personneTable.idPers] }),
}));

export const insertEvaluationSchema = createInsertSchema(evaluationTable).omit({ idEval: true, created_at: true });
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluationTable.$inferSelect;
