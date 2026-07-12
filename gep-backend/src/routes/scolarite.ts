import { Router } from "express";
import { db } from "@workspace/db";
import { scolariteTable, insertScolariteSchema, tranchesTable, cycleTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, requireDirecteur } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";
import { ensureTranchesForClasse } from "../lib/tranches.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.SECRETAIRE));

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
    const { libelle, description } = req.body;
    const data: Record<string, unknown> = {};
    if (libelle !== undefined) data.libelle = libelle;
    if (description !== undefined) data.description = description;
    if (Object.keys(data).length > 0) {
      await db.update(cycleTable).set(data).where(eq(cycleTable.idCycle, Number(req.params.id)));
    }
    res.json({ message: "Cycle mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/cycles/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(cycleTable).set({ isDelete: 1 }).where(eq(cycleTable.idCycle, Number(req.params.id)));
    res.json({ message: "Cycle supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

/** Vue "pension par cycle" pour l'écran directeur : chaque cycle + sa pension si déjà fixée. */
router.get("/classes", async (_req, res) => {
  try {
    const cycles = await db.select().from(cycleTable);
    const scols = await db.select().from(scolariteTable);
    const result = cycles.map((cycle) => ({
      ...cycle,
      scolarite: scols.find((s) => s.idCycle === cycle.idCycle) || null,
    }));
    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

/**
 * Génère (si besoin) et renvoie les 3 tranches (1/3 pension chacune) d'une classe
 * pour une année académique donnée. Idempotent — appelé par le poste comptable
 * quand il sélectionne un élève + une année pour enregistrer un paiement.
 */
router.get("/tranches", async (req, res) => {
  try {
    const { idClasse, idAca } = req.query as Record<string, string>;
    if (!idClasse || !idAca) {
      const tranches = await db.select().from(tranchesTable);
      res.json(tranches);
      return;
    }
    const result = await ensureTranchesForClasse(Number(idClasse), Number(idAca));
    if (!result) { res.status(404).json({ error: "Aucune pension configurée pour cette classe" }); return; }
    res.json(result.tranches);
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

// Fixer la pension d'un cycle est réservé au directeur (RG spec).
router.post("/", requireDirecteur, validate(insertScolariteSchema), async (req, res) => {
  try {
    const [existing] = await db.select().from(scolariteTable).where(eq(scolariteTable.idCycle, req.body.idCycle)).limit(1);
    if (existing) { res.status(409).json({ error: "Ce cycle a déjà une pension configurée — modifiez-la plutôt" }); return; }
    await db.insert(scolariteTable).values({ ...req.body, idFondateur: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Pension enregistrée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", requireDirecteur, async (req, res) => {
  try {
    const { montant, idCycle, description } = req.body;
    const data: Record<string, unknown> = {};
    if (montant !== undefined) data.montant = montant;
    if (idCycle !== undefined) data.idCycle = idCycle;
    if (description !== undefined) data.description = description;
    if (Object.keys(data).length > 0) {
      await db.update(scolariteTable).set(data).where(eq(scolariteTable.idScolarite, Number(req.params.id)));
    }
    const [s] = await db.select().from(scolariteTable).where(eq(scolariteTable.idScolarite, Number(req.params.id))).limit(1);
    if (!s) { res.status(404).json({ error: "Scolarité introuvable" }); return; }
    res.json(s);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", requireDirecteur, async (req, res) => {
  try {
    await db.delete(scolariteTable).where(eq(scolariteTable.idScolarite, Number(req.params.id)));
    res.json({ message: "Pension supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
