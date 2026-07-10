import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { enseignantTable, coursTable, parentsTable, frequenteTable, salleTable, classeTable } from "@workspace/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { ROLES, getRole } from "./rbac.ts";

/** Distinct idClasse the given enseignant (Personne.idPers) actually teaches. */
export async function getEnseignantClasseIds(idPers: number): Promise<number[]> {
  const rows = await db
    .select({ idClasse: coursTable.idClasse })
    .from(enseignantTable)
    .innerJoin(coursTable, eq(enseignantTable.idCours, coursTable.idCours))
    .where(and(eq(enseignantTable.idPers, idPers), eq(enseignantTable.isDelete, 0)));
  return [...new Set(rows.map((r) => r.idClasse))];
}

/** Distinct idCours the given enseignant teaches (for scoping evaluations/absences). */
export async function getEnseignantCoursIds(idPers: number): Promise<number[]> {
  const rows = await db
    .select({ idCours: enseignantTable.idCours })
    .from(enseignantTable)
    .where(and(eq(enseignantTable.idPers, idPers), eq(enseignantTable.isDelete, 0)));
  return [...new Set(rows.map((r) => r.idCours))];
}

/** Distinct matricule linked to the given parent (Personne.idPers). */
export async function getParentMatricules(idPers: number): Promise<number[]> {
  const rows = await db
    .select({ matricule: parentsTable.matricule })
    .from(parentsTable)
    .where(and(eq(parentsTable.idPers, idPers), eq(parentsTable.isDelete, 0)));
  return [...new Set(rows.map((r) => r.matricule))];
}

/** Distinct idClasse of the given parent's linked children (for scoping their own child's schedule). */
export async function getParentClasseIds(idPers: number): Promise<number[]> {
  const matricules = await getParentMatricules(idPers);
  if (matricules.length === 0) return [];
  const rows = await db
    .select({ idClasse: classeTable.idClasse })
    .from(frequenteTable)
    .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
    .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
    .where(inArray(frequenteTable.matricule, matricules));
  return [...new Set(rows.map((r) => r.idClasse))];
}

/**
 * Express middleware factory: blocks an Enseignant/Parent from reaching a student
 * (identified by `paramName`, default "id") outside their own scope. Administrateur
 * and Comptable always pass through untouched.
 */
export function requireEleveScope(paramName = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = getRole(req.user);
    const matricule = Number(req.params[paramName]);
    if (role === ROLES.ENSEIGNANT) {
      const classeIds = await getEnseignantClasseIds(req.user!.id);
      const [row] = await db
        .select({ idClasse: classeTable.idClasse })
        .from(frequenteTable)
        .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
        .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
        .where(eq(frequenteTable.matricule, matricule))
        .orderBy(desc(frequenteTable.idFrequente))
        .limit(1);
      if (!row || !classeIds.includes(row.idClasse)) { res.status(403).json({ error: "Accès refusé : élève hors de vos classes" }); return; }
    } else if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      if (!matricules.includes(matricule)) { res.status(403).json({ error: "Accès refusé : cet élève ne vous est pas lié" }); return; }
    }
    next();
  };
}
