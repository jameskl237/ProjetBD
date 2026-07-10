import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  id: number;
  username: string;
  type: "admin" | "personne";
  typeAdmin?: number;
  typePersonne?: number;
  nom: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token d'authentification manquant" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: "Configuration serveur invalide" }); return; }
  try {
    req.user = jwt.verify(token, secret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
