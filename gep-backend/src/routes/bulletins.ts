import { Router } from "express";
import { db } from "@workspace/db";
import { bulletinTable, appreciationTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";

const router = Router();
router.use(authenticate);

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const bulletins = await db.select().from(bulletinTable);
    res.json(bulletins);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, etat } = req.body;
    if (!libelle) { res.status(400).json({ error: "libelle requis" }); return; }
    await db.insert(bulletinTable).values({ libelle, etat: etat ?? 0, created_at: new Date() });
    res.status(201).json({ message: "Bulletin créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(bulletinTable).set(req.body).where(eq(bulletinTable.idBulletin, Number(req.params.id)));
    res.json({ message: "Bulletin mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(bulletinTable).where(eq(bulletinTable.idBulletin, Number(req.params.id)));
    res.json({ message: "Bulletin supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
