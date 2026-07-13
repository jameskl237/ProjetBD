import type { Request, Response, NextFunction } from "express";
import type { AuthPayload } from "./auth.ts";

export const ROLES = {
  ADMINISTRATEUR: "administrateur",
  SECRETAIRE: "secretaire",
  COMPTABLE: "comptable",
  ENSEIGNANT: "enseignant",
  PARENT: "parent",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Maps a raw JWT payload to one of the 5 spec'd roles.
 * Admin.typeAdmin: 1=directeur, 2=secrétaire, 3=comptable
 * Personne.typePersonne: 1=enseignant, 2=parent
 */
export function getRole(user?: AuthPayload): Role | null {
  if (!user) return null;
  if (user.type === "admin") {
    if (user.typeAdmin === 1) return ROLES.ADMINISTRATEUR;
    if (user.typeAdmin === 2) return ROLES.SECRETAIRE;
    if (user.typeAdmin === 3) return ROLES.COMPTABLE;
    return ROLES.ADMINISTRATEUR;
  }
  if (user.type === "personne") {
    return user.typePersonne === 1 ? ROLES.ENSEIGNANT : ROLES.PARENT;
  }
  return null;
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { res.status(401).json({ error: "Non authentifié" }); return; }
    const role = getRole(req.user);
    if (!role || !roles.includes(role)) { res.status(403).json({ error: "Accès refusé : permissions insuffisantes" }); return; }
    next();
  };
}

/** Directeur-only (typeAdmin===1): reserved for user-account management (RG spec). */
export function requireDirecteur(req: Request, res: Response, next: NextFunction) {
  if (!req.user) { res.status(401).json({ error: "Non authentifié" }); return; }
  if (req.user.type === "admin" && req.user.typeAdmin === 1) { next(); return; }
  res.status(403).json({ error: "Accès refusé : réservé au directeur" });
}

/** Secrétaire-only (typeAdmin===2). */
export function requireSecretaire(req: Request, res: Response, next: NextFunction) {
  if (!req.user) { res.status(401).json({ error: "Non authentifié" }); return; }
  if (req.user.type === "admin" && req.user.typeAdmin === 2) { next(); return; }
  res.status(403).json({ error: "Accès refusé : réservé à la secrétaire" });
}
