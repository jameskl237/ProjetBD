import { Router } from "express";
import { db } from "@workspace/db";
import { personneTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, requireDirecteur, ROLES } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE));

const safeFields = {
  idPers: personneTable.idPers,
  nom: personneTable.nom,
  prenom: personneTable.prenom,
  login: personneTable.login,
  username: personneTable.username,
  mobile: personneTable.mobile,
  phone: personneTable.phone,
  email: personneTable.email,
  langue: personneTable.langue,
  typePersonne: personneTable.typePersonne,
  actif: personneTable.actif,
  sexe: personneTable.sexe,
  dateNaissance: personneTable.dateNaissance,
  lieuNaissance: personneTable.lieuNaissance,
  created_at: personneTable.created_at,
};

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.SECRETAIRE), async (_req, res) => {
  try {
    const personnes = await db.select(safeFields).from(personneTable).where(eq(personneTable.isDelete, 0));
    res.json(personnes);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/me", async (req, res) => {
  try {
    const [p] = await db.select(safeFields).from(personneTable).where(eq(personneTable.idPers, req.user!.id)).limit(1);
    if (!p) { res.status(404).json({ error: "Personne introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/me", async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (password) updateData.password = await bcrypt.hash(password, 12);
    await db.update(personneTable).set(updateData).where(eq(personneTable.idPers, req.user!.id));
    const [p] = await db.select(safeFields).from(personneTable).where(eq(personneTable.idPers, req.user!.id)).limit(1);
    if (!p) { res.status(404).json({ error: "Personne introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE), async (req, res) => {
  try {
    const [p] = await db.select(safeFields).from(personneTable).where(eq(personneTable.idPers, Number(req.params.id))).limit(1);
    if (!p) { res.status(404).json({ error: "Personne introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

const createPersonneSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(8),
  typePersonne: z.number().int().min(1).max(2),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  sexe: z.number().optional(),
});

router.post("/", requireDirecteur, validate(createPersonneSchema), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const now = new Date();
    await db.insert(personneTable).values({ ...rest, password: hashed, idAdmin: req.user!.id, created_at: now, createdAt: now, updatedAt: now });
    res.status(201).json({ message: "Personne créée avec succès" });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Login déjà utilisé" }); return; }
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", requireDirecteur, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (password) updateData.password = await bcrypt.hash(password, 12);
    await db.update(personneTable).set(updateData).where(eq(personneTable.idPers, Number(req.params.id)));
    const [p] = await db.select(safeFields).from(personneTable).where(eq(personneTable.idPers, Number(req.params.id))).limit(1);
    if (!p) { res.status(404).json({ error: "Personne introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", requireDirecteur, async (req, res) => {
  try {
    await db.update(personneTable).set({ isDelete: 1, updatedAt: new Date() }).where(eq(personneTable.idPers, Number(req.params.id)));
    res.json({ message: "Personne supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
