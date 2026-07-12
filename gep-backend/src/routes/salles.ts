import { Router } from "express";
import { db } from "@workspace/db";
import { salleTable, classeTable, insertSalleSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR));

router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select({ salle: salleTable, classe: classeTable })
      .from(salleTable)
      .leftJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse));
    const salles = rows.map(({ salle, classe }) => ({ ...salle, classe }));
    res.json(salles);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const rows = await db
      .select({ salle: salleTable, classe: classeTable })
      .from(salleTable)
      .leftJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
      .where(eq(salleTable.idSalle, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Salle introuvable" }); return; }
    res.json({ ...rows[0].salle, classe: rows[0].classe });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

// Une salle se crée toujours libre : l'affectation à une classe se fait exclusivement
// depuis la création/modification de la classe (voir classes.ts), jamais depuis ici.
router.post("/", validate(insertSalleSchema), async (req, res) => {
  try {
    const { idClasse: _ignoredIdClasse, ...rest } = req.body;
    await db.insert(salleTable).values({ ...rest, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Salle créée avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", async (req, res) => {
  try {
    // On autorise seulement à libérer une salle (idClasse: null) depuis cet endpoint —
    // l'affecter à une classe se fait uniquement via classes.ts, pour garder une seule
    // source de vérité et éviter qu'une salle occupée soit réaffectée par erreur.
    if ("idClasse" in req.body && req.body.idClasse != null) {
      res.status(400).json({ error: "L'affectation d'une salle à une classe se fait depuis la page Classes" });
      return;
    }
    const { libelle, position, surface, actif, capacite } = req.body;
    const data: Record<string, unknown> = {};
    if (libelle !== undefined) data.libelle = libelle;
    if (position !== undefined) data.position = position;
    if (surface !== undefined) data.surface = surface;
    if (actif !== undefined) data.actif = actif;
    if (capacite !== undefined) data.capacite = capacite;
    if (Object.keys(data).length > 0) {
      await db.update(salleTable).set(data).where(eq(salleTable.idSalle, Number(req.params.id)));
    }
    const rows = await db
      .select({ salle: salleTable, classe: classeTable })
      .from(salleTable)
      .leftJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
      .where(eq(salleTable.idSalle, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Salle introuvable" }); return; }
    res.json({ ...rows[0].salle, classe: rows[0].classe });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const [salle] = await db.select().from(salleTable).where(eq(salleTable.idSalle, Number(req.params.id))).limit(1);
    if (!salle) { res.status(404).json({ error: "Salle introuvable" }); return; }
    if (salle.idClasse != null) { res.status(409).json({ error: "Cette salle est occupée par une classe : libérez-la avant de la supprimer" }); return; }
    await db.delete(salleTable).where(eq(salleTable.idSalle, Number(req.params.id)));
    res.json({ message: "Salle supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
