import { Router } from "express";
import { db } from "@workspace/db";
import { parentsTable, insertParentsSchema, rapportTable, disciplineTable, insertDisciplineSchema, personneTable, eleveTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE));

router.get("/rapports", async (_req, res) => {
  try {
    const rows = await db
      .select({ rapport: rapportTable, eleve: eleveTable, discipline: disciplineTable, auteur: personneTable })
      .from(rapportTable)
      .leftJoin(eleveTable, eq(rapportTable.matricule, eleveTable.matricule))
      .leftJoin(disciplineTable, eq(rapportTable.idDiscipline, disciplineTable.ID))
      .leftJoin(personneTable, eq(rapportTable.idPers, personneTable.idPers))
      .where(eq(rapportTable.isDelete, 0));
    const rapports = rows.map(({ rapport, eleve, discipline, auteur }) => ({ ...rapport, eleve, discipline, auteur }));
    res.json(rapports);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/rapports/:id", async (req, res) => {
  try {
    const [r] = await db.select().from(rapportTable).where(eq(rapportTable.idRap, Number(req.params.id))).limit(1);
    if (!r) { res.status(404).json({ error: "Rapport introuvable" }); return; }
    res.json(r);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/rapports", async (req, res) => {
  try {
    const { matricule, idAca, commentaire, event_date, idDiscipline } = req.body;
    if (!matricule || !idAca || !commentaire || !event_date) {
      res.status(400).json({ error: "Champs requis: matricule, idAca, commentaire, event_date" }); return;
    }
    await db.insert(rapportTable).values({ matricule, idAca, commentaire, event_date, idDiscipline, idPers: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Rapport créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/rapports/:id", async (req, res) => {
  try {
    await db.update(rapportTable).set(req.body).where(eq(rapportTable.idRap, Number(req.params.id)));
    res.json({ message: "Rapport mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/rapports/:id", async (req, res) => {
  try {
    await db.update(rapportTable).set({ isDelete: 1 }).where(eq(rapportTable.idRap, Number(req.params.id)));
    res.json({ message: "Rapport supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/disciplines", async (_req, res) => {
  try {
    const disciplines = await db.select().from(disciplineTable);
    res.json(disciplines);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/disciplines", validate(insertDisciplineSchema), async (req, res) => {
  try {
    await db.insert(disciplineTable).values(req.body);
    res.status(201).json({ message: "Type de discipline créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/disciplines/:id", async (req, res) => {
  try {
    await db.update(disciplineTable).set(req.body).where(eq(disciplineTable.ID, Number(req.params.id)));
    res.json({ message: "Discipline mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select({ parent: parentsTable, personne: personneTable, eleve: eleveTable })
      .from(parentsTable)
      .leftJoin(personneTable, eq(parentsTable.idPers, personneTable.idPers))
      .leftJoin(eleveTable, eq(parentsTable.matricule, eleveTable.matricule))
      .where(eq(parentsTable.isDelete, 0));
    const parents = rows.map(({ parent, personne, eleve }) => ({ ...parent, personne, eleve }));
    res.json(parents);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [p] = await db.select().from(parentsTable).where(eq(parentsTable.idParent, Number(req.params.id))).limit(1);
    if (!p) { res.status(404).json({ error: "Lien parent introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", validate(insertParentsSchema), async (req, res) => {
  try {
    await db.insert(parentsTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Lien parent-élève créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.update(parentsTable).set({ isDelete: 1 }).where(eq(parentsTable.idParent, Number(req.params.id)));
    res.json({ message: "Lien supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
