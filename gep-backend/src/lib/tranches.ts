import { db } from "@workspace/db";
import { scolariteTable, trimestreTable, tranchesTable, paiementTable, classeTable } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Une classe a toujours exactement N tranches (1 par trimestre de l'année),
 * chacune valant pension/N. Générées à la demande — jamais saisies à la main —
 * et le montant est figé au moment de la génération pour ne pas bouger si la
 * pension du cycle change ensuite.
 */
export async function ensureTranchesForClasse(idClasse: number, idAca: number) {
  const [classe] = await db.select().from(classeTable).where(eq(classeTable.idClasse, idClasse)).limit(1);
  if (!classe) return null;

  const [scolarite] = await db.select().from(scolariteTable).where(eq(scolariteTable.idCycle, classe.idCycle)).limit(1);
  if (!scolarite) return null;

  const trimestres = await db
    .select()
    .from(trimestreTable)
    .where(eq(trimestreTable.idAca, idAca))
    .orderBy(trimestreTable.idTrimes);
  if (trimestres.length === 0) return { scolarite, tranches: [] as (typeof tranchesTable.$inferSelect & { trimestre: typeof trimestreTable.$inferSelect })[] };

  const existing = await db
    .select()
    .from(tranchesTable)
    .where(and(eq(tranchesTable.idScolarite, scolarite.idScolarite), inArray(tranchesTable.idTrimestre, trimestres.map((t) => t.idTrimes))));
  const existingByTrimestre = new Map(existing.map((t) => [t.idTrimestre, t]));

  const nbreTranches = scolarite.nbreTranche || 3;
  const montantTranche = Math.round((scolarite.pension / nbreTranches) * 100) / 100;
  for (const trimestre of trimestres) {
    if (existingByTrimestre.has(trimestre.idTrimes)) continue;
    await db.insert(tranchesTable).values({
      libelle: trimestre.libelle,
      montant: montantTranche,
      idScolarite: scolarite.idScolarite,
      idTrimestre: trimestre.idTrimes,
      actif: 1,
      idFondateur: scolarite.idFondateur,
    });
  }

  const tranches = await db
    .select()
    .from(tranchesTable)
    .where(and(eq(tranchesTable.idScolarite, scolarite.idScolarite), inArray(tranchesTable.idTrimestre, trimestres.map((t) => t.idTrimes))));
  const trimestreById = new Map(trimestres.map((t) => [t.idTrimes, t]));
  return {
    scolarite,
    tranches: tranches
      .map((t) => ({ ...t, trimestre: trimestreById.get(t.idTrimestre)! }))
      .sort((a, b) => a.trimestre.idTrimes - b.trimestre.idTrimes),
  };
}

/** Statut de paiement des 3 tranches d'un élève (montant dû / payé / restant) pour une année donnée. */
export async function getTrancheStatutForEleve(matricule: number, idClasse: number, idAca: number) {
  const result = await ensureTranchesForClasse(idClasse, idAca);
  if (!result) return null;

  const idTranches = result.tranches.map((t) => t.idTranche);
  const paiements = idTranches.length === 0
    ? []
    : await db.select().from(paiementTable).where(and(eq(paiementTable.matricule, matricule), inArray(paiementTable.idTranche, idTranches)));
  const payeParTranche = new Map<number, number>();
  for (const p of paiements) {
    if (p.idTranche == null) continue;
    payeParTranche.set(p.idTranche, (payeParTranche.get(p.idTranche) ?? 0) + Number(p.montant));
  }

  return result.tranches.map((t) => {
    const montantPaye = payeParTranche.get(t.idTranche) ?? 0;
    const montantRestant = Math.max(0, Math.round((t.montant - montantPaye) * 100) / 100);
    return {
      idTranche: t.idTranche,
      idTrimestre: t.idTrimestre,
      libelle: t.trimestre.libelle,
      periode: t.trimestre.periode,
      montant: t.montant,
      montantPaye,
      montantRestant,
      statut: montantRestant <= 0 ? "payé" : montantPaye > 0 ? "partiel" : "impayé",
    };
  });
}
