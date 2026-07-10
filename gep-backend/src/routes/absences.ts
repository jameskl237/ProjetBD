import { Router } from "express";
import { db } from "@workspace/db";
import { absenceTable, eleveTable, coursTable, personneTable, anneeAcademiqueTable } from "@workspace/db/schema";
import { eq, and, inArray, desc, type SQL } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getEnseignantCoursIds, getParentMatricules } from "../middlewares/scope.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT));

async function absencesWithRelations(where?: SQL) {
  const rows = await db
    .select({ absence: absenceTable, eleve: eleveTable, cours: coursTable, auteur: personneTable })
    .from(absenceTable)
    .leftJoin(eleveTable, eq(absenceTable.matricule, eleveTable.matricule))
    .leftJoin(coursTable, eq(absenceTable.idCours, coursTable.idCours))
    .leftJoin(personneTable, eq(absenceTable.idPers, personneTable.idPers))
    .where(where ? and(eq(absenceTable.isDelete, 0), where) : eq(absenceTable.isDelete, 0));
  return rows.map(({ absence, eleve, cours, auteur }) => ({ ...absence, eleve, cours, auteur }));
}

router.get("/", async (req, res) => {
  try {
    const role = getRole(req.user);
    let where: SQL | undefined;
    if (role === ROLES.ENSEIGNANT) {
      const coursIds = await getEnseignantCoursIds(req.user!.id);
      where = coursIds.length === 0 ? eq(absenceTable.idCours, -1) : inArray(absenceTable.idCours, coursIds);
    } else if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      where = matricules.length === 0 ? eq(absenceTable.matricule, -1) : inArray(absenceTable.matricule, matricules);
    }
    res.json(await absencesWithRelations(where));
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [a] = await absencesWithRelations(eq(absenceTable.idAbsence, Number(req.params.id)));
    if (!a) { res.status(404).json({ error: "Absence introuvable" }); return; }
    const role = getRole(req.user);
    if (role === ROLES.ENSEIGNANT) {
      const coursIds = await getEnseignantCoursIds(req.user!.id);
      if (!coursIds.includes(a.idCours)) { res.status(403).json({ error: "Accès refusé" }); return; }
    } else if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      if (!matricules.includes(a.matricule)) { res.status(403).json({ error: "Accès refusé" }); return; }
    }
    res.json(a);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const { matricule, idCours, date, commentaire, justifiee } = req.body;
    if (!matricule || !idCours || !date) { res.status(400).json({ error: "Champs requis: matricule, idCours, date" }); return; }
    const coursIds = await getEnseignantCoursIds(req.user!.id);
    if (!coursIds.includes(Number(idCours))) { res.status(403).json({ error: "Accès refusé : cours hors de vos affectations" }); return; }
    const [latestAnnee] = await db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.isDelete, 0)).orderBy(desc(anneeAcademiqueTable.idAnnee)).limit(1);
    if (!latestAnnee) { res.status(400).json({ error: "Aucune année académique active" }); return; }
    await db.insert(absenceTable).values({
      matricule,
      idCours,
      date,
      commentaire: commentaire ?? "",
      justifiee: justifiee ? 1 : 0,
      idPers: req.user!.id,
      idAca: latestAnnee.idAnnee,
      created_at: new Date(),
    });
    res.status(201).json({ message: "Absence enregistrée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/justifier", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(absenceTable).set({ justifiee: req.body.justifiee === false ? 0 : 1 }).where(eq(absenceTable.idAbsence, Number(req.params.id)));
    res.json({ message: "Absence mise à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(absenceTable).set({ isDelete: 1 }).where(eq(absenceTable.idAbsence, Number(req.params.id)));
    res.json({ message: "Absence supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
