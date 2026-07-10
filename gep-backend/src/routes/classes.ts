import { Router } from "express";
import { db } from "@workspace/db";
import {
  classeTable,
  cycleTable,
  salleTable,
  frequenteTable,
  evaluationTable,
  rapportTable,
  personneTable,
  coursTable,
  anneeAcademiqueTable,
  eleveTable,
} from "@workspace/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getEnseignantClasseIds } from "../middlewares/scope.ts";

const router = Router();
router.use(authenticate);

async function attachClassStats(classes: (typeof classeTable.$inferSelect)[]) {
  const classIds = classes.map((c) => c.idClasse);
  if (classIds.length === 0) return classes.map((classe) => ({ ...classe, effectif: 0, moyenne: null, incidents: 0, titulaire: null, salles: [], matieres: [], topStudents: [] }));

  const [latestAnnee] = await db
    .select()
    .from(anneeAcademiqueTable)
    .where(eq(anneeAcademiqueTable.isDelete, 0))
    .orderBy(desc(anneeAcademiqueTable.idAnnee))
    .limit(1);

  const [salles, cours, titulaires] = await Promise.all([
    db.select().from(salleTable).where(inArray(salleTable.idClasse, classIds)),
    db.select().from(coursTable).where(inArray(coursTable.idClasse, classIds)),
    (async () => {
      const ids = [...new Set(classes.map((c) => c.titulaire).filter((id): id is number => id != null))];
      if (ids.length === 0) return [];
      return db.select().from(personneTable).where(inArray(personneTable.idPers, ids));
    })(),
  ]);

  const salleIds = salles.map((s) => s.idSalle);
  const roster = salleIds.length === 0 || !latestAnnee
    ? []
    : await db
        .select({ idSalle: frequenteTable.idSalle, matricule: frequenteTable.matricule })
        .from(frequenteTable)
        .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee)));

  const salleToClasse = new Map(salles.map((s) => [s.idSalle, s.idClasse]));
  const matriculesByClasse = new Map<number, Set<number>>();
  for (const row of roster) {
    const idClasse = salleToClasse.get(row.idSalle);
    if (idClasse == null) continue;
    if (!matriculesByClasse.has(idClasse)) matriculesByClasse.set(idClasse, new Set());
    matriculesByClasse.get(idClasse)!.add(row.matricule);
  }

  const allMatricules = [...new Set(roster.map((r) => r.matricule))];
  const [evaluations, rapports, eleves] = await Promise.all([
    allMatricules.length === 0
      ? []
      : db.select({ matricule: evaluationTable.matricule, note: evaluationTable.note }).from(evaluationTable).where(inArray(evaluationTable.matricule, allMatricules)),
    allMatricules.length === 0
      ? []
      : db.select({ matricule: rapportTable.matricule }).from(rapportTable).where(inArray(rapportTable.matricule, allMatricules)),
    allMatricules.length === 0
      ? []
      : db.select({ matricule: eleveTable.matricule, nom: eleveTable.nom, prenom: eleveTable.prenom }).from(eleveTable).where(inArray(eleveTable.matricule, allMatricules)),
  ]);
  const eleveByMatricule = new Map(eleves.map((e) => [e.matricule, e]));

  const notesByMatricule = new Map<number, number[]>();
  for (const row of evaluations) {
    if (!notesByMatricule.has(row.matricule)) notesByMatricule.set(row.matricule, []);
    notesByMatricule.get(row.matricule)!.push(Number(row.note));
  }

  const matriculeToClasse = new Map<number, number>();
  for (const [idClasse, matricules] of matriculesByClasse) {
    for (const m of matricules) matriculeToClasse.set(m, idClasse);
  }

  const notesByClasse = new Map<number, number[]>();
  for (const row of evaluations) {
    const idClasse = matriculeToClasse.get(row.matricule);
    if (idClasse == null) continue;
    if (!notesByClasse.has(idClasse)) notesByClasse.set(idClasse, []);
    notesByClasse.get(idClasse)!.push(Number(row.note));
  }

  const incidentsByClasse = new Map<number, number>();
  for (const row of rapports) {
    const idClasse = matriculeToClasse.get(row.matricule);
    if (idClasse == null) continue;
    incidentsByClasse.set(idClasse, (incidentsByClasse.get(idClasse) ?? 0) + 1);
  }

  const sallesByClasse = new Map<number, typeof salles>();
  for (const s of salles) {
    if (s.idClasse == null) continue; // la requête filtre déjà par idClasse IN classIds, donc toujours non-null ici
    if (!sallesByClasse.has(s.idClasse)) sallesByClasse.set(s.idClasse, []);
    sallesByClasse.get(s.idClasse)!.push(s);
  }

  const coursByClasse = new Map<number, typeof cours>();
  for (const c of cours) {
    if (!coursByClasse.has(c.idClasse)) coursByClasse.set(c.idClasse, []);
    coursByClasse.get(c.idClasse)!.push(c);
  }

  const titulaireById = new Map(titulaires.map((t) => [t.idPers, t]));

  return classes.map((classe) => {
    const notes = notesByClasse.get(classe.idClasse) ?? [];
    const matricules = [...(matriculesByClasse.get(classe.idClasse) ?? [])];
    const topStudents = matricules
      .map((matricule) => {
        const studentNotes = notesByMatricule.get(matricule) ?? [];
        if (studentNotes.length === 0) return null;
        const eleve = eleveByMatricule.get(matricule);
        return {
          matricule,
          nom: eleve?.nom ?? null,
          prenom: eleve?.prenom ?? null,
          moyenne: studentNotes.reduce((a, b) => a + b, 0) / studentNotes.length,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s != null)
      .sort((a, b) => b.moyenne - a.moyenne)
      .slice(0, 5);
    return {
      ...classe,
      effectif: matriculesByClasse.get(classe.idClasse)?.size ?? 0,
      moyenne: notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
      incidents: incidentsByClasse.get(classe.idClasse) ?? 0,
      titulaire: classe.titulaire != null ? titulaireById.get(classe.titulaire) ?? null : null,
      salles: sallesByClasse.get(classe.idClasse) ?? [],
      matieres: coursByClasse.get(classe.idClasse) ?? [],
      topStudents,
    };
  });
}

router.get("/:id/eleves", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.COMPTABLE), async (req, res) => {
  try {
    if (getRole(req.user) === ROLES.ENSEIGNANT) {
      const classeIds = await getEnseignantClasseIds(req.user!.id);
      if (!classeIds.includes(Number(req.params.id))) { res.status(403).json({ error: "Accès refusé : classe hors de vos affectations" }); return; }
    }
    const [latestAnnee] = await db
      .select()
      .from(anneeAcademiqueTable)
      .where(eq(anneeAcademiqueTable.isDelete, 0))
      .orderBy(desc(anneeAcademiqueTable.idAnnee))
      .limit(1);
    if (!latestAnnee) { res.json([]); return; }
    const salles = await db.select().from(salleTable).where(eq(salleTable.idClasse, Number(req.params.id)));
    const salleIds = salles.map((s) => s.idSalle);
    if (salleIds.length === 0) { res.json([]); return; }
    const rows = await db
      .select({ frequente: frequenteTable, eleve: eleveTable })
      .from(frequenteTable)
      .innerJoin(eleveTable, eq(frequenteTable.matricule, eleveTable.matricule))
      .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee), eq(eleveTable.isDelete, 0)));
    const seen = new Set<number>();
    const eleves = rows
      .filter((r) => {
        if (seen.has(r.eleve.matricule)) return false;
        seen.add(r.eleve.matricule);
        return true;
      })
      .map((r) => r.eleve);
    res.json(eleves);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const rows = await db
      .select({ classe: classeTable, cycle: cycleTable })
      .from(classeTable)
      .leftJoin(cycleTable, eq(classeTable.idCycle, cycleTable.idCycle))
      .where(eq(classeTable.isDelete, 0));
    const stats = await attachClassStats(rows.map((r) => r.classe));
    res.json(stats.map((classe, i) => ({ ...classe, cycle: rows[i]!.cycle })));
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.COMPTABLE), async (req, res) => {
  try {
    const rows = await db
      .select({ classe: classeTable, cycle: cycleTable })
      .from(classeTable)
      .leftJoin(cycleTable, eq(classeTable.idCycle, cycleTable.idCycle))
      .where(eq(classeTable.idClasse, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Classe introuvable" }); return; }
    const [stats] = await attachClassStats([rows[0].classe]);
    res.json({ ...stats, cycle: rows[0].cycle });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

/**
 * Une classe occupe exactement une salle. La salle est le porteur de la relation
 * (Salle.idClasse), donc créer/modifier une classe doit systématiquement
 * réclamer une salle libre (idClasse IS NULL) plutôt que l'inverse — une salle ne
 * doit jamais être créée pré-affectée à une classe.
 */
router.post("/", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, idCycle, idSalle, titulaire } = req.body;
    if (!libelle || !idCycle) { res.status(400).json({ error: "Champs requis: libelle, idCycle" }); return; }
    if (!idSalle) { res.status(400).json({ error: "La salle que la classe occupera est obligatoire" }); return; }

    const [salle] = await db.select().from(salleTable).where(eq(salleTable.idSalle, Number(idSalle))).limit(1);
    if (!salle) { res.status(404).json({ error: "Salle introuvable" }); return; }
    if (salle.idClasse != null) { res.status(409).json({ error: "Cette salle est déjà affectée à une autre classe" }); return; }

    const [result] = await db.insert(classeTable).values({
      libelle,
      idCycle: Number(idCycle),
      titulaire: titulaire ?? null,
      idAdmin: req.user!.id,
      created_at: new Date(),
    });
    await db.update(salleTable).set({ idClasse: result.insertId }).where(eq(salleTable.idSalle, Number(idSalle)));
    const [classe] = await db.select().from(classeTable).where(eq(classeTable.idClasse, result.insertId)).limit(1);
    res.status(201).json({ message: "Classe créée avec succès", classe });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const { idSalle, ...classeData } = req.body;

    if (idSalle !== undefined && idSalle !== null) {
      const newSalleId = Number(idSalle);
      const [newSalle] = await db.select().from(salleTable).where(eq(salleTable.idSalle, newSalleId)).limit(1);
      if (!newSalle) { res.status(404).json({ error: "Salle introuvable" }); return; }
      if (newSalle.idClasse != null && newSalle.idClasse !== classId) {
        res.status(409).json({ error: "Cette salle est déjà affectée à une autre classe" });
        return;
      }
      await db.update(salleTable).set({ idClasse: null }).where(eq(salleTable.idClasse, classId));
      await db.update(salleTable).set({ idClasse: classId }).where(eq(salleTable.idSalle, newSalleId));
    }

    if (Object.keys(classeData).length > 0) {
      await db.update(classeTable).set(classeData).where(eq(classeTable.idClasse, classId));
    }

    const rows = await db
      .select({ classe: classeTable, cycle: cycleTable })
      .from(classeTable)
      .leftJoin(cycleTable, eq(classeTable.idCycle, cycleTable.idCycle))
      .where(eq(classeTable.idClasse, classId))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Classe introuvable" }); return; }
    const [stats] = await attachClassStats([rows[0].classe]);
    res.json({ ...stats, cycle: rows[0].cycle });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const classId = Number(req.params.id);
    // Libère la salle occupée : elle redevient disponible pour une autre classe.
    await db.update(salleTable).set({ idClasse: null }).where(eq(salleTable.idClasse, classId));
    await db.update(classeTable).set({ isDelete: 1 }).where(eq(classeTable.idClasse, classId));
    res.json({ message: "Classe supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
