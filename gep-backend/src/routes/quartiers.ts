import { Router } from "express";
import { db } from "@workspace/db";
import { quartierTable, insertQuartierSchema, residentsTable, insertResidentsSchema, villeNaissanceTable, insertVilleNaissanceSchema, personneTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR));

router.get("/villes", async (_req, res) => {
  try {
    const villes = await db.select().from(villeNaissanceTable);
    res.json(villes);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/villes", validate(insertVilleNaissanceSchema), async (req, res) => {
  try {
    await db.insert(villeNaissanceTable).values(req.body);
    res.status(201).json({ message: "Ville créée" });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Ville déjà existante" }); return; }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/villes/:id", async (req, res) => {
  try {
    await db.update(villeNaissanceTable).set(req.body).where(eq(villeNaissanceTable.idVille, Number(req.params.id)));
    const [v] = await db.select().from(villeNaissanceTable).where(eq(villeNaissanceTable.idVille, Number(req.params.id))).limit(1);
    if (!v) { res.status(404).json({ error: "Ville introuvable" }); return; }
    res.json(v);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/villes/:id", async (req, res) => {
  try {
    await db.delete(villeNaissanceTable).where(eq(villeNaissanceTable.idVille, Number(req.params.id)));
    res.json({ message: "Ville supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/residents", async (_req, res) => {
  try {
    const rows = await db
      .select({ resident: residentsTable, personne: personneTable, quartier: quartierTable })
      .from(residentsTable)
      .leftJoin(personneTable, eq(residentsTable.idPers, personneTable.idPers))
      .leftJoin(quartierTable, eq(residentsTable.idQuartier, quartierTable.idQuartier));
    const residents = rows.map(({ resident, personne, quartier }) => ({ ...resident, personne, quartier }));
    res.json(residents);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/residents", validate(insertResidentsSchema), async (req, res) => {
  try {
    await db.insert(residentsTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Résident créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/residents/:id", async (req, res) => {
  try {
    await db.update(residentsTable).set({ isDelete: 1 }).where(eq(residentsTable.idResi, Number(req.params.id)));
    res.json({ message: "Résident supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", async (_req, res) => {
  try {
    const quartiers = await db.select().from(quartierTable);
    res.json(quartiers);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", validate(insertQuartierSchema), async (req, res) => {
  try {
    await db.insert(quartierTable).values(req.body);
    res.status(201).json({ message: "Quartier créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  try {
    await db.update(quartierTable).set(req.body).where(eq(quartierTable.idQuartier, Number(req.params.id)));
    const [q] = await db.select().from(quartierTable).where(eq(quartierTable.idQuartier, Number(req.params.id))).limit(1);
    if (!q) { res.status(404).json({ error: "Quartier introuvable" }); return; }
    res.json(q);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(quartierTable).where(eq(quartierTable.idQuartier, Number(req.params.id)));
    res.json({ message: "Quartier supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
