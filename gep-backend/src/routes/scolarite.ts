import { Router } from "express";
import { db } from "@workspace/db";
import { scolariteTable, insertScolariteSchema, tranchesTable, insertTranchesSchema, cycleTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE));

router.get("/cycles", async (_req, res) => {
  try {
    const cycles = await db.select().from(cycleTable);
    res.json(cycles);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/cycles", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, description } = req.body;
    if (!libelle) { res.status(400).json({ error: "libelle requis" }); return; }
    await db.insert(cycleTable).values({ libelle, description: description ?? "", idAdmin: req.user!.id, created: new Date() });
    res.status(201).json({ message: "Cycle créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/cycles/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(cycleTable).set(req.body).where(eq(cycleTable.idCycle, Number(req.params.id)));
    res.json({ message: "Cycle mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/cycles/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(cycleTable).set({ isDelete: 1 }).where(eq(cycleTable.idCycle, Number(req.params.id)));
    res.json({ message: "Cycle supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/tranches", async (_req, res) => {
  try {
    const tranches = await db.select().from(tranchesTable);
    res.json(tranches);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/tranches", authorize(ROLES.COMPTABLE), validate(insertTranchesSchema), async (req, res) => {
  try {
    await db.insert(tranchesTable).values({ ...req.body, idFondateur: req.user!.id });
    res.status(201).json({ message: "Tranche créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/tranches/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.update(tranchesTable).set(req.body).where(eq(tranchesTable.idTranche, Number(req.params.id)));
    res.json({ message: "Tranche mise à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/tranches/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.delete(tranchesTable).where(eq(tranchesTable.idTranche, Number(req.params.id)));
    res.json({ message: "Tranche supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", async (_req, res) => {
  try {
    const scols = await db.select().from(scolariteTable);
    res.json(scols);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [s] = await db.select().from(scolariteTable).where(eq(scolariteTable.idScolarite, Number(req.params.id))).limit(1);
    if (!s) { res.status(404).json({ error: "Scolarité introuvable" }); return; }
    res.json(s);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.COMPTABLE), validate(insertScolariteSchema), async (req, res) => {
  try {
    await db.insert(scolariteTable).values({ ...req.body, idFondateur: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Scolarité créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.update(scolariteTable).set(req.body).where(eq(scolariteTable.idScolarite, Number(req.params.id)));
    const [s] = await db.select().from(scolariteTable).where(eq(scolariteTable.idScolarite, Number(req.params.id))).limit(1);
    if (!s) { res.status(404).json({ error: "Scolarité introuvable" }); return; }
    res.json(s);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.update(scolariteTable).set({ isDelete: 1 }).where(eq(scolariteTable.idScolarite, Number(req.params.id)));
    res.json({ message: "Scolarité supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
