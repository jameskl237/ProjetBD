import { Router } from "express";
import { db } from "@workspace/db";
import { abonnementTable, eleveTable } from "@workspace/db/schema";
import { eq, and, inArray, type SQL } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getParentMatricules } from "../middlewares/scope.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.PARENT));

async function abonnementsWithRelations(where?: SQL) {
  const rows = await db
    .select({ abonnement: abonnementTable, eleve: eleveTable })
    .from(abonnementTable)
    .leftJoin(eleveTable, eq(abonnementTable.matricule, eleveTable.matricule))
    .where(where);
  return rows.map(({ abonnement, eleve }) => ({ ...abonnement, eleve }));
}

router.get("/abonnements", async (req, res) => {
  try {
    const role = getRole(req.user);
    let where: SQL | undefined;
    if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      where = matricules.length === 0 ? eq(abonnementTable.matricule, -1) : inArray(abonnementTable.matricule, matricules);
    }
    res.json(await abonnementsWithRelations(where));
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/abonnements/:id", async (req, res) => {
  try {
    const [a] = await abonnementsWithRelations(eq(abonnementTable.idAbonnement, Number(req.params.id)));
    if (!a) { res.status(404).json({ error: "Abonnement introuvable" }); return; }
    if (getRole(req.user) === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      if (!matricules.includes(a.matricule)) { res.status(403).json({ error: "Accès refusé" }); return; }
    }
    res.json(a);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/abonnements", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { matricule, type, dateDebut, dateFin, actif } = req.body;
    if (!matricule || type == null || !dateDebut) { res.status(400).json({ error: "Champs requis: matricule, type, dateDebut" }); return; }
    await db.insert(abonnementTable).values({
      matricule,
      type,
      dateDebut,
      dateFin: dateFin ?? null,
      actif: actif === false ? 0 : 1,
      idAdmin: req.user!.id,
      created_at: new Date(),
    });
    res.status(201).json({ message: "Abonnement transport créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/abonnements/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(abonnementTable).set(req.body).where(eq(abonnementTable.idAbonnement, Number(req.params.id)));
    const [a] = await abonnementsWithRelations(eq(abonnementTable.idAbonnement, Number(req.params.id)));
    if (!a) { res.status(404).json({ error: "Abonnement introuvable" }); return; }
    res.json(a);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/abonnements/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(abonnementTable).set({ actif: 0 }).where(eq(abonnementTable.idAbonnement, Number(req.params.id)));
    res.json({ message: "Abonnement désactivé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
