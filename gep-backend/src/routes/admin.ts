import { Router } from "express";
import { db } from "@workspace/db";
import { adminTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.ts";
import { requireDirecteur } from "../middlewares/rbac.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
// Managing admin accounts (create/deactivate/etc.) is reserved to the directeur (typeAdmin=1);
// secrétaire (typeAdmin=2) has every other Administrateur privilege but not this one.
router.use(authenticate, requireDirecteur);

const createAdminSchema = z.object({
  login: z.string().min(3),
  password: z.string().min(8),
  typeAdmin: z.number().int().min(1).max(3),
  username: z.string().optional(),
  langue: z.string().optional(),
});

const safeFields = {
  ID: adminTable.ID,
  login: adminTable.login,
  username: adminTable.username,
  actif: adminTable.actif,
  typeAdmin: adminTable.typeAdmin,
  isDelete: adminTable.isDelete,
  createdAt: adminTable.createdAt,
  langue: adminTable.langue,
};

router.get("/", async (_req, res) => {
  try {
    const admins = await db.select(safeFields).from(adminTable);
    res.json(admins);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const [admin] = await db.select(safeFields).from(adminTable).where(eq(adminTable.ID, Number(req.params.id))).limit(1);
    if (!admin) { res.status(404).json({ error: "Admin introuvable" }); return; }
    res.json(admin);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", validate(createAdminSchema), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const now = new Date();
    await db.insert(adminTable).values({ ...rest, password: hashed, createdAt: now, updatedAt: now });
    const [admin] = await db.select(safeFields).from(adminTable).where(eq(adminTable.login, rest.login)).limit(1);
    res.status(201).json(admin);
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Login déjà utilisé" }); return; }
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest, updatedAt: new Date() };
    if (password) updateData.password = await bcrypt.hash(password, 12);
    await db.update(adminTable).set(updateData).where(eq(adminTable.ID, Number(req.params.id)));
    const [admin] = await db.select(safeFields).from(adminTable).where(eq(adminTable.ID, Number(req.params.id))).limit(1);
    if (!admin) { res.status(404).json({ error: "Admin introuvable" }); return; }
    res.json(admin);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/actif", async (req, res) => {
  try {
    await db.update(adminTable).set({ actif: req.body.actif, updatedAt: new Date() }).where(eq(adminTable.ID, Number(req.params.id)));
    const [admin] = await db.select(safeFields).from(adminTable).where(eq(adminTable.ID, Number(req.params.id))).limit(1);
    if (!admin) { res.status(404).json({ error: "Admin introuvable" }); return; }
    res.json(admin);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.update(adminTable).set({ isDelete: 1, updatedAt: new Date() }).where(eq(adminTable.ID, Number(req.params.id)));
    res.json({ message: "Admin supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
