import { Router } from "express";
import { db } from "@workspace/db";
import {
  eleveTable,
  enseignantTable,
  classeTable,
  coursTable,
  paiementTable,
  evaluationTable,
  personneTable,
  frequenteTable,
  salleTable,
  anneeAcademiqueTable,
  messagesTable,
  emploiDuTempsTable,
  absenceTable,
  titulaireTable,
  cycleTable,
} from "@workspace/db/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE));

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

router.get("/stats", async (_req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);

    const [latestAnnee] = await db
      .select()
      .from(anneeAcademiqueTable)
      .where(eq(anneeAcademiqueTable.isDelete, 0))
      .orderBy(desc(anneeAcademiqueTable.idAnnee))
      .limit(1);

    const [
      [{ value: totalEleves }],
      [{ value: totalEnseignants }],
      [{ value: totalClasses }],
      [{ value: totalCours }],
      [{ total: thisMonthTotal }],
      [{ total: totalEncaisse }],
      monthlyFlowRows,
      topStudentsRows,
      performanceRows,
      levelDistributionRows,
      noticesRows,
      latestAnnee,
      coursBySectionRows,
      absencesTodayRows,
      enseignantsWithCoursRows,
      studentsByGenreRows,
    ] = await Promise.all([
      db.select({ value: count() }).from(eleveTable).where(eq(eleveTable.isDelete, 0)),
      db.select({ value: count() }).from(enseignantTable).where(eq(enseignantTable.isDelete, 0)),
      db.select({ value: count() }).from(classeTable).where(eq(classeTable.isDelete, 0)),
      db.select({ value: count() }).from(coursTable).where(eq(coursTable.isDelete, 0)),
      db
        .select({ total: sql<number>`coalesce(sum(${paiementTable.montant}), 0)` })
        .from(paiementTable)
        .where(gte(paiementTable.datePaie, startOfMonth)),
      db
        .select({ total: sql<number>`coalesce(sum(${paiementTable.montant}), 0)` })
        .from(paiementTable),
      db
        .select({
          month: sql<string>`date_format(${paiementTable.datePaie}, '%Y-%m')`,
          total: sql<number>`coalesce(sum(${paiementTable.montant}), 0)`,
        })
        .from(paiementTable)
        .where(gte(paiementTable.datePaie, eightMonthsAgo))
        .groupBy(sql`date_format(${paiementTable.datePaie}, '%Y-%m')`)
        .orderBy(sql`date_format(${paiementTable.datePaie}, '%Y-%m')`),
      db
        .select({
          matricule: eleveTable.matricule,
          nom: eleveTable.nom,
          prenom: eleveTable.prenom,
          moyenne: sql<number>`avg(${evaluationTable.note})`,
          nbEvaluations: count(evaluationTable.idEval),
        })
        .from(evaluationTable)
        .innerJoin(eleveTable, eq(evaluationTable.matricule, eleveTable.matricule))
        .where(eq(eleveTable.isDelete, 0))
        .groupBy(eleveTable.matricule, eleveTable.nom, eleveTable.prenom)
        .orderBy(desc(sql`avg(${evaluationTable.note})`))
        .limit(5),
      db
        .select({
          idCours: coursTable.idCours,
          libelle: coursTable.libelle,
          moyenne: sql<number>`avg(${evaluationTable.note})`,
        })
        .from(evaluationTable)
        .innerJoin(coursTable, eq(evaluationTable.idCours, coursTable.idCours))
        .where(eq(coursTable.isDelete, 0))
        .groupBy(coursTable.idCours, coursTable.libelle)
        .orderBy(desc(sql`avg(${evaluationTable.note})`))
        .limit(8),
      db
        .select({
          classe: classeTable.libelle,
          effectif: sql<number>`count(distinct ${frequenteTable.matricule})`,
        })
        .from(frequenteTable)
        .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
        .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
        .where(and(eq(classeTable.isDelete, 0), eq(frequenteTable.idAcademi, latestAnnee?.idAnnee)))
        .groupBy(classeTable.libelle)
        .orderBy(desc(sql`count(distinct ${frequenteTable.matricule})`))
        .limit(6),
      db
        .select({ message: messagesTable, expediteur: personneTable })
        .from(messagesTable)
        .leftJoin(personneTable, eq(messagesTable.idExp_Pers, personneTable.idPers))
        .where(eq(messagesTable.valider, 1))
        .orderBy(desc(messagesTable.created_at))
        .limit(5),
      db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.isDelete, 0)).orderBy(desc(anneeAcademiqueTable.idAnnee)).limit(1),
      db
        .select({
          section: cycleTable.libelle,
          nb: count(coursTable.idCours),
        })
        .from(coursTable)
        .innerJoin(classeTable, eq(coursTable.idClasse, classeTable.idClasse))
        .innerJoin(cycleTable, eq(classeTable.idCycle, cycleTable.idCycle))
        .where(eq(coursTable.isDelete, 0))
        .groupBy(cycleTable.libelle),
      db
        .select({ value: count() })
        .from(absenceTable)
        .where(sql`${absenceTable.date} = curdate() AND ${absenceTable.isDelete} = 0`),
      db
        .select({
          nom: personneTable.nom,
          prenom: personneTable.prenom,
          nbCours: count(enseignantTable.idCours),
        })
        .from(enseignantTable)
        .innerJoin(personneTable, eq(enseignantTable.idPers, personneTable.idPers))
        .where(eq(enseignantTable.isDelete, 0))
        .groupBy(enseignantTable.idPers, personneTable.nom, personneTable.prenom)
        .orderBy(desc(count(enseignantTable.idCours)))
        .limit(8),
      db
        .select({
          sexe: eleveTable.sexe,
          total: count(),
        })
        .from(eleveTable)
        .where(eq(eleveTable.isDelete, 0))
        .groupBy(eleveTable.sexe),
    ]);

    const today = JOURS_FR[now.getDay()];
    const upcomingSessions = await db
      .select({ emploi: emploiDuTempsTable, classe: classeTable, cours: coursTable })
      .from(emploiDuTempsTable)
      .innerJoin(classeTable, eq(emploiDuTempsTable.idClasse, classeTable.idClasse))
      .innerJoin(coursTable, eq(emploiDuTempsTable.idCours, coursTable.idCours))
      .where(sql`lower(${emploiDuTempsTable.jour}) = ${today}`)
      .orderBy(emploiDuTempsTable.heure)
      .limit(5);

    res.json({
      annee: latestAnnee ?? null,
      totals: {
        eleves: Number(totalEleves),
        enseignants: Number(totalEnseignants),
        classes: Number(totalClasses),
        cours: Number(totalCours),
      },
      paiements: {
        thisMonthTotal: Number(thisMonthTotal ?? 0),
        totalEncaisse: Number(totalEncaisse ?? 0),
        monthlyFlow: monthlyFlowRows.map((r) => ({ month: r.month, total: Number(r.total) })),
      },
      topStudents: topStudentsRows.map((r) => ({
        matricule: r.matricule,
        nom: r.nom,
        prenom: r.prenom,
        moyenne: Number(r.moyenne),
        nbEvaluations: Number(r.nbEvaluations),
      })),
      performanceByCours: performanceRows.map((r) => ({
        idCours: r.idCours,
        libelle: r.libelle,
        moyenne: Number(r.moyenne),
      })),
      levelDistribution: levelDistributionRows.map((r) => ({
        classe: r.classe,
        effectif: Number(r.effectif),
      })),
      notices: noticesRows.map(({ message, expediteur }) => ({
        idMessages: message.idMessages,
        titre: message.objet || message.subject,
        contenu: message.content ?? message.information,
        date: message.created_at,
        auteur: expediteur ? `${expediteur.nom ?? ""} ${expediteur.prenom ?? ""}`.trim() : null,
      })),
      messagesEnAttente: await db
        .select({ value: count() })
        .from(messagesTable)
        .where(eq(messagesTable.valider, 0))
        .then((r) => Number(r[0]?.value ?? 0)),
      absencesAujourdhui: Number(absencesTodayRows[0]?.value ?? 0),
      coursBySection: coursBySectionRows.map((r) => ({ section: r.section, nb: Number(r.nb) })),
      enseignants: enseignantsWithCoursRows.map((r) => ({
        nom: r.nom,
        prenom: r.prenom,
        nbCours: Number(r.nbCours),
      })),
      studentsByGenre: studentsByGenreRows.map((r) => ({
        sexe: Number(r.sexe),
        total: Number(r.total),
      })),
      upcomingSessions: upcomingSessions.map(({ emploi, classe, cours }) => ({
        idTemps: emploi.idTemps,
        jour: emploi.jour,
        heure: emploi.heure,
        classe: classe.libelle,
        cours: cours.libelle,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
