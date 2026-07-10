import { Router } from "express";
import { db } from "@workspace/db";
import { coursTable, insertCoursSchema, enseignantTable, insertEnseignantSchema, emploiDuTempsTable, insertEmploiDuTempsSchema, titulaireTable, insertTitulaireSchema, personneTable, classeTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getEnseignantCoursIds, getParentClasseIds } from "../middlewares/scope.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate);

/**
 * RG05: an enseignant cannot be booked into two different salles for the same jour+heure.
 * The real teacher↔cours assignment lives in the Enseignant join table (idPers/idCours),
 * not Cours.idEnseignant (an unused legacy column), so conflicts must be resolved through it.
 */
async function findEmploiConflict(jour: string, heure: string, idCours: number, idSalle: number, excludeIdTemps?: number) {
  const enseignants = await db
    .select({ idPers: enseignantTable.idPers })
    .from(enseignantTable)
    .where(and(eq(enseignantTable.idCours, idCours), eq(enseignantTable.isDelete, 0)));
  const idPersList = enseignants.map((e) => e.idPers);
  if (idPersList.length === 0) return null;

  const sameSlot = await db
    .select({ emploi: emploiDuTempsTable, enseignant: enseignantTable })
    .from(emploiDuTempsTable)
    .innerJoin(coursTable, eq(emploiDuTempsTable.idCours, coursTable.idCours))
    .innerJoin(enseignantTable, and(eq(enseignantTable.idCours, coursTable.idCours), eq(enseignantTable.isDelete, 0)))
    .where(and(eq(emploiDuTempsTable.jour, jour), eq(emploiDuTempsTable.heure, heure), inArray(enseignantTable.idPers, idPersList)));

  return sameSlot.find((row) => row.emploi.idSalle !== idSalle && row.emploi.idTemps !== excludeIdTemps) ?? null;
}

router.get("/enseignants", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const rows = await db
      .select({ enseignant: enseignantTable, personne: personneTable, cours: coursTable, classe: classeTable })
      .from(enseignantTable)
      .leftJoin(personneTable, eq(enseignantTable.idPers, personneTable.idPers))
      .leftJoin(coursTable, eq(enseignantTable.idCours, coursTable.idCours))
      .leftJoin(classeTable, eq(coursTable.idClasse, classeTable.idClasse))
      .where(eq(enseignantTable.isDelete, 0));
    const ens = rows.map(({ enseignant, personne, cours, classe }) => ({
      ...enseignant,
      personne,
      cours: cours ? { ...cours, classe } : null,
    }));
    res.json(ens);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [e] = await db.select().from(enseignantTable).where(eq(enseignantTable.idEnseignant, Number(req.params.id))).limit(1);
    if (!e) { res.status(404).json({ error: "Enseignant introuvable" }); return; }
    res.json(e);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/enseignants", authorize(ROLES.ADMINISTRATEUR), validate(insertEnseignantSchema), async (req, res) => {
  try {
    await db.insert(enseignantTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Enseignant affecté avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(enseignantTable).set(req.body).where(eq(enseignantTable.idEnseignant, Number(req.params.id)));
    res.json({ message: "Enseignant mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(enseignantTable).set({ isDelete: 1 }).where(eq(enseignantTable.idEnseignant, Number(req.params.id)));
    res.json({ message: "Enseignant retiré" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/emploi-du-temps", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT), async (req, res) => {
  try {
    const edt = await db.select().from(emploiDuTempsTable);
    const role = getRole(req.user);
    if (role === ROLES.ENSEIGNANT) {
      const coursIds = new Set(await getEnseignantCoursIds(req.user!.id));
      res.json(edt.filter((e) => coursIds.has(e.idCours)));
      return;
    }
    if (role === ROLES.PARENT) {
      const classeIds = new Set(await getParentClasseIds(req.user!.id));
      res.json(edt.filter((e) => classeIds.has(e.idClasse)));
      return;
    }
    res.json(edt);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/emploi-du-temps", authorize(ROLES.ADMINISTRATEUR), validate(insertEmploiDuTempsSchema), async (req, res) => {
  try {
    const { jour, heure, idCours, idSalle } = req.body;
    const conflict = await findEmploiConflict(jour, heure, idCours, idSalle);
    if (conflict) { res.status(409).json({ error: "Conflit d'emploi du temps : cet enseignant est déjà affecté à une autre salle sur ce créneau" }); return; }
    await db.insert(emploiDuTempsTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Créneau ajouté" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/emploi-du-temps/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const idTemps = Number(req.params.id);
    const [current] = await db.select().from(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, idTemps)).limit(1);
    if (!current) { res.status(404).json({ error: "Créneau introuvable" }); return; }
    const jour = req.body.jour ?? current.jour;
    const heure = req.body.heure ?? current.heure;
    const idCours = req.body.idCours ?? current.idCours;
    const idSalle = req.body.idSalle ?? current.idSalle;
    const conflict = await findEmploiConflict(jour, heure, idCours, idSalle, idTemps);
    if (conflict) { res.status(409).json({ error: "Conflit d'emploi du temps : cet enseignant est déjà affecté à une autre salle sur ce créneau" }); return; }
    await db.update(emploiDuTempsTable).set(req.body).where(eq(emploiDuTempsTable.idTemps, idTemps));
    const [edt] = await db.select().from(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, idTemps)).limit(1);
    res.json(edt);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/emploi-du-temps/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, Number(req.params.id)));
    res.json({ message: "Créneau supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/titulaires", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const tit = await db.select().from(titulaireTable);
    res.json(tit);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/titulaires", authorize(ROLES.ADMINISTRATEUR), validate(insertTitulaireSchema), async (req, res) => {
  try {
    await db.insert(titulaireTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Titulaire affecté" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [t] = await db.select().from(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id))).limit(1);
    if (!t) { res.status(404).json({ error: "Titulaire introuvable" }); return; }
    res.json(t);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(titulaireTable).set(req.body).where(eq(titulaireTable.idTitulaire, Number(req.params.id)));
    const [t] = await db.select().from(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id))).limit(1);
    if (!t) { res.status(404).json({ error: "Titulaire introuvable" }); return; }
    res.json(t);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id)));
    res.json({ message: "Titulaire supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const cours = await db.select().from(coursTable);
    res.json(cours);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [c] = await db.select().from(coursTable).where(eq(coursTable.idCours, Number(req.params.id))).limit(1);
    if (!c) { res.status(404).json({ error: "Cours introuvable" }); return; }
    res.json(c);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), validate(insertCoursSchema), async (req, res) => {
  try {
    await db.insert(coursTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Cours créé avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(coursTable).set(req.body).where(eq(coursTable.idCours, Number(req.params.id)));
    const [c] = await db.select().from(coursTable).where(eq(coursTable.idCours, Number(req.params.id))).limit(1);
    if (!c) { res.status(404).json({ error: "Cours introuvable" }); return; }
    res.json(c);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(coursTable).set({ isDelete: 1 }).where(eq(coursTable.idCours, Number(req.params.id)));
    res.json({ message: "Cours supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
