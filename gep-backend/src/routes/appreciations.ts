import { Router } from "express";
import { db } from "@workspace/db";
import { appreciationTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";

const router = Router();
router.use(authenticate);

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT), async (_req, res) => {
  try {
    const appreciations = await db.select().from(appreciationTable);
    res.json(appreciations);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { grade, libelleFr, libelleEn, descriptionFr, descriptionEn, noteMin, noteMax, ordre } = req.body;
    if (!grade || !libelleFr || !libelleEn || noteMin == null || noteMax == null) {
      res.status(400).json({ error: "Champs requis: grade, libelleFr, libelleEn, noteMin, noteMax" }); return;
    }
    await db.insert(appreciationTable).values({ grade, libelleFr, libelleEn, descriptionFr: descriptionFr ?? "", descriptionEn: descriptionEn ?? "", noteMin, noteMax, ordre: ordre ?? 0 });
    res.status(201).json({ message: "Appréciation créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(appreciationTable).set(req.body).where(eq(appreciationTable.idAppreciation, Number(req.params.id)));
    res.json({ message: "Appréciation mise à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(appreciationTable).where(eq(appreciationTable.idAppreciation, Number(req.params.id)));
    res.json({ message: "Appréciation supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
