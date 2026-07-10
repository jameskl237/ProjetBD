import { Router } from "express";
import { db } from "@workspace/db";
import { anneeAcademiqueTable, trimestreTable, insertTrimestreSchema, frequenteTable, eleveTable, salleTable, classeTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate);

router.get("/trimestres", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const trimestres = await db.select().from(trimestreTable);
    res.json(trimestres);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/trimestres", authorize(ROLES.ADMINISTRATEUR), validate(insertTrimestreSchema), async (req, res) => {
  try {
    await db.insert(trimestreTable).values({ ...req.body, idAdmin: req.user!.id });
    res.status(201).json({ message: "Trimestre créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/trimestres/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(trimestreTable).set(req.body).where(eq(trimestreTable.idTrimes, Number(req.params.id)));
    res.json({ message: "Trimestre mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/trimestres/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(trimestreTable).where(eq(trimestreTable.idTrimes, Number(req.params.id)));
    res.json({ message: "Trimestre supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

async function inscriptionsWithRelations(where?: ReturnType<typeof eq>) {
  const query = db
    .select({ frequente: frequenteTable, eleve: eleveTable, salle: salleTable, classe: classeTable, annee: anneeAcademiqueTable })
    .from(frequenteTable)
    .leftJoin(eleveTable, eq(frequenteTable.matricule, eleveTable.matricule))
    .leftJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
    .leftJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
    .leftJoin(anneeAcademiqueTable, eq(frequenteTable.idAcademi, anneeAcademiqueTable.idAnnee));
  const rows = where ? await query.where(where) : await query;
  return rows.map(({ frequente, eleve, salle, classe, annee }) => ({ ...frequente, eleve, salle, classe, annee }));
}

router.get("/inscriptions", authorize(ROLES.ADMINISTRATEUR), async (_req, res) => {
  try {
    const inscriptions = await inscriptionsWithRelations();
    res.json(inscriptions);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/inscriptions", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { matricule, idAnnee, idSalle } = req.body;
    if (!matricule || !idAnnee || !idSalle) {
      res.status(400).json({ error: "Champs requis: matricule, idAnnee, idSalle" }); return;
    }
    await db.insert(frequenteTable).values({ matricule, idAcademi: idAnnee, idSalle, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Inscription créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/inscriptions/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const [inscription] = await inscriptionsWithRelations(eq(frequenteTable.idFrequente, Number(req.params.id)));
    if (!inscription) { res.status(404).json({ error: "Inscription introuvable" }); return; }
    res.json(inscription);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/inscriptions/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(frequenteTable).set(req.body).where(eq(frequenteTable.idFrequente, Number(req.params.id)));
    const [inscription] = await inscriptionsWithRelations(eq(frequenteTable.idFrequente, Number(req.params.id)));
    if (!inscription) { res.status(404).json({ error: "Inscription introuvable" }); return; }
    res.json(inscription);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/inscriptions/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(frequenteTable).where(eq(frequenteTable.idFrequente, Number(req.params.id)));
    res.json({ message: "Inscription supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const annees = await db.select().from(anneeAcademiqueTable);
    res.json(annees);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (req, res) => {
  try {
    const [a] = await db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.idAnnee, Number(req.params.id))).limit(1);
    if (!a) { res.status(404).json({ error: "Année introuvable" }); return; }
    res.json(a);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, periode } = req.body;
    if (!libelle) { res.status(400).json({ error: "libelle requis" }); return; }
    const today = new Date().toISOString().split("T")[0];
    await db.insert(anneeAcademiqueTable).values({ libelle, periode: periode ?? "", created_at: today, idAdmin: req.user!.id });
    res.status(201).json({ message: "Année académique créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(anneeAcademiqueTable).set(req.body).where(eq(anneeAcademiqueTable.idAnnee, Number(req.params.id)));
    const [a] = await db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.idAnnee, Number(req.params.id))).limit(1);
    if (!a) { res.status(404).json({ error: "Année introuvable" }); return; }
    res.json(a);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(anneeAcademiqueTable).set({ isDelete: 1 }).where(eq(anneeAcademiqueTable.idAnnee, Number(req.params.id)));
    res.json({ message: "Année supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
