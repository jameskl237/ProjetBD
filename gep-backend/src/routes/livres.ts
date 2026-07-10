import { Router } from "express";
import { db } from "@workspace/db";
import { livreTable, livresTable, insertLivreSchema, insertLivresSchema, specialiteTable, insertSpecialiteSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR));

router.get("/specialites", async (_req, res) => {
  try {
    const specs = await db.select().from(specialiteTable);
    res.json(specs);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/specialites", validate(insertSpecialiteSchema), async (req, res) => {
  try {
    await db.insert(specialiteTable).values({ ...req.body, idAdmin: req.user!.id });
    res.status(201).json({ message: "Spécialité créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/specialites/:id", async (req, res) => {
  try {
    await db.update(specialiteTable).set(req.body).where(eq(specialiteTable.idSpecialite, Number(req.params.id)));
    res.json({ message: "Spécialité mise à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/stock", async (_req, res) => {
  try {
    const livres = await db.select().from(livresTable);
    res.json(livres);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/stock", validate(insertLivresSchema), async (req, res) => {
  try {
    await db.insert(livresTable).values({ ...req.body, idAdmin: req.user!.id });
    res.status(201).json({ message: "Livre stock ajouté" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", async (_req, res) => {
  try {
    const livres = await db.select().from(livreTable);
    res.json(livres);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [l] = await db.select().from(livreTable).where(eq(livreTable.idLivre, Number(req.params.id))).limit(1);
    if (!l) { res.status(404).json({ error: "Livre introuvable" }); return; }
    res.json(l);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", validate(insertLivreSchema), async (req, res) => {
  try {
    await db.insert(livreTable).values({ ...req.body, idAdmin: req.user!.id });
    res.status(201).json({ message: "Livre créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  try {
    await db.update(livreTable).set(req.body).where(eq(livreTable.idLivre, Number(req.params.id)));
    const [l] = await db.select().from(livreTable).where(eq(livreTable.idLivre, Number(req.params.id))).limit(1);
    if (!l) { res.status(404).json({ error: "Livre introuvable" }); return; }
    res.json(l);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(livreTable).where(eq(livreTable.idLivre, Number(req.params.id)));
    res.json({ message: "Livre supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
