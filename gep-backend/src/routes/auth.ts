import { Router } from "express";
import { db } from "@workspace/db";
import { adminTable, personneTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.ts";

const router = Router();

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Identifiants invalides" }); return; }
  const { login, password } = result.data;
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: "Configuration serveur invalide" }); return; }

  try {
    const [admin] = await db.select().from(adminTable).where(eq(adminTable.login, login)).limit(1);
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) { res.status(401).json({ error: "Identifiants incorrects" }); return; }
      if (!admin.actif) { res.status(403).json({ error: "Compte désactivé" }); return; }
      const token = jwt.sign(
        { id: admin.ID, login: admin.login, type: "admin", typeAdmin: admin.typeAdmin },
        secret, { expiresIn: "24h" }
      );
      const roleLabel = admin.typeAdmin === 1 ? "Directeur" : admin.typeAdmin === 2 ? "Secrétaire" : "Comptable";
      res.json({ token, user: { id: admin.ID, login: admin.login, role: roleLabel, type: "admin", typeAdmin: admin.typeAdmin } });
      return;
    }

    const [personne] = await db.select().from(personneTable).where(eq(personneTable.login, login)).limit(1);
    if (personne) {
      const valid = await bcrypt.compare(password, personne.password ?? "");
      if (!valid) { res.status(401).json({ error: "Identifiants incorrects" }); return; }
      if (!personne.actif) { res.status(403).json({ error: "Compte désactivé" }); return; }
      const token = jwt.sign(
        { id: personne.idPers, login: personne.login!, type: "personne", typePersonne: personne.typePersonne, nom: `${personne.nom ?? ""} ${personne.prenom ?? ""}`.trim() },
        secret, { expiresIn: "24h" }
      );
      const roleLabel = personne.typePersonne === 1 ? "Enseignant" : "Parent";
      res.json({ token, user: { id: personne.idPers, login: personne.login, nom: `${personne.nom ?? ""} ${personne.prenom ?? ""}`.trim(), role: roleLabel, type: "personne", typePersonne: personne.typePersonne } });
      return;
    }

    res.status(401).json({ error: "Identifiants incorrects" });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    res.status(500).json({
      error: "Erreur serveur",
      detail: message.includes("Access denied")
        ? "La base de données refuse l’utilisateur configuré. Vérifiez les identifiants MySQL."
        : message,
    });
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json(req.user);
});

export default router;
