import { Router } from "express";
import { db } from "@workspace/db";
import {
  eleveTable,
  insertEleveSchema,
  paiementTable,
  evaluationTable,
  frequenteTable,
  villeNaissanceTable,
  anneeAcademiqueTable,
  modeTable,
  salleTable,
  classeTable,
  parentsTable,
  personneTable,
  coursTable,
  rapportTable,
  disciplineTable,
} from "@workspace/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getEnseignantClasseIds, getParentMatricules, requireEleveScope } from "../middlewares/scope.ts";

const parentSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  login: z.string().min(3),
  password: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
  sexe: z.number().int().optional(),
});

const villeNaissanceInputSchema = z.string().trim().min(1, "Ville de naissance requise");

const inscriptionSchema = z.object({
  idSalle: z.coerce.number().int(),
  idAnnee: z.coerce.number().int(),
  commentaire: z.string().optional(),
});

/** Finds an existing VilleNaissance row by name (trimmed) or creates one. Must run inside the caller's transaction. */
async function resolveVilleNaissance(tx: typeof db, villeName: string): Promise<number> {
  const libelle = villeName.trim();
  const [existing] = await tx.select().from(villeNaissanceTable).where(eq(villeNaissanceTable.libelle, libelle)).limit(1);
  if (existing) return existing.idVille;
  const [inserted] = await tx.insert(villeNaissanceTable).values({ libelle, actif: 1 });
  return inserted.insertId;
}

const router = Router();
router.use(authenticate);

/** Filters an already-enriched eleve list down to what the caller's role is allowed to see. */
async function scopeElevesForRole<T extends { matricule: number; inscriptions: { classe?: { idClasse?: number } }[] }>(
  eleves: T[],
  userId: number,
  role: ReturnType<typeof getRole>,
): Promise<T[]> {
  if (role === ROLES.ENSEIGNANT) {
    const classeIds = new Set(await getEnseignantClasseIds(userId));
    return eleves.filter((e) => e.inscriptions.some((i) => i.classe?.idClasse != null && classeIds.has(i.classe.idClasse)));
  }
  if (role === ROLES.PARENT) {
    const matricules = new Set(await getParentMatricules(userId));
    return eleves.filter((e) => matricules.has(e.matricule));
  }
  return eleves;
}

async function attachRelations(eleves: (typeof eleveTable.$inferSelect)[]) {
  const matricules = eleves.map((e) => e.matricule);
  if (matricules.length === 0) return eleves.map((eleve) => ({ ...eleve, inscriptions: [], tuteurs: [] }));

  const [inscriptionRows, tuteurRows] = await Promise.all([
    db
      .select({ frequente: frequenteTable, salle: salleTable, classe: classeTable, annee: anneeAcademiqueTable })
      .from(frequenteTable)
      .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
      .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
      .leftJoin(anneeAcademiqueTable, eq(frequenteTable.idAcademi, anneeAcademiqueTable.idAnnee))
      .where(inArray(frequenteTable.matricule, matricules))
      .orderBy(desc(frequenteTable.idFrequente)),
    db
      .select({ parent: parentsTable, personne: personneTable })
      .from(parentsTable)
      .innerJoin(personneTable, eq(parentsTable.idPers, personneTable.idPers))
      .where(and(inArray(parentsTable.matricule, matricules), eq(parentsTable.isDelete, 0))),
  ]);

  const inscriptionByMatricule = new Map<number, { classe: unknown; annee: unknown; idSalle: number }>();
  for (const row of inscriptionRows) {
    if (!inscriptionByMatricule.has(row.frequente.matricule)) {
      inscriptionByMatricule.set(row.frequente.matricule, { classe: row.classe, annee: row.annee, idSalle: row.frequente.idSalle });
    }
  }

  const tuteursByMatricule = new Map<number, { tuteur: unknown }[]>();
  for (const row of tuteurRows) {
    const list = tuteursByMatricule.get(row.parent.matricule) ?? [];
    list.push({ tuteur: row.personne });
    tuteursByMatricule.set(row.parent.matricule, list);
  }

  return eleves.map((eleve) => {
    const inscription = inscriptionByMatricule.get(eleve.matricule);
    return {
      ...eleve,
      inscriptions: inscription ? [inscription] : [],
      tuteurs: tuteursByMatricule.get(eleve.matricule) ?? [],
    };
  });
}

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT), async (req, res) => {
  try {
    const rows = await db
      .select({ eleve: eleveTable, ville: villeNaissanceTable })
      .from(eleveTable)
      .leftJoin(villeNaissanceTable, eq(eleveTable.idVilleNaissance, villeNaissanceTable.idVille))
      .where(eq(eleveTable.isDelete, 0));
    const eleves = await attachRelations(rows.map((r) => r.eleve));
    const withVille = eleves.map((eleve, i) => ({ ...eleve, ville: rows[i]!.ville }));
    const scoped = await scopeElevesForRole(withVille, req.user!.id, getRole(req.user));
    res.json(scoped);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id/paiements", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT), requireEleveScope(), async (req, res) => {
  try {
    const rows = await db
      .select({ paiement: paiementTable, annee: anneeAcademiqueTable, mode: modeTable })
      .from(paiementTable)
      .leftJoin(anneeAcademiqueTable, eq(paiementTable.idAca, anneeAcademiqueTable.idAnnee))
      .leftJoin(modeTable, eq(paiementTable.idMode, modeTable.idMode))
      .where(eq(paiementTable.matricule, Number(req.params.id)));
    const paiements = rows.map(({ paiement, annee, mode }) => ({ ...paiement, annee, mode }));
    const total = paiements.reduce((s, p) => s + Number(p.montant ?? 0), 0);
    res.json({ paiements, total });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id/notes", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT), requireEleveScope(), async (req, res) => {
  try {
    const rows = await db
      .select({ evaluation: evaluationTable, cours: coursTable, personne: personneTable })
      .from(evaluationTable)
      .leftJoin(coursTable, eq(evaluationTable.idCours, coursTable.idCours))
      .leftJoin(personneTable, eq(evaluationTable.idPers, personneTable.idPers))
      .where(eq(evaluationTable.matricule, Number(req.params.id)));
    const notes = rows.map(({ evaluation, cours, personne }) => ({ ...evaluation, cours, enseignant: personne }));
    res.json(notes);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id/inscriptions", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const inscriptions = await db.select().from(frequenteTable).where(eq(frequenteTable.matricule, Number(req.params.id)));
    res.json(inscriptions);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id/rapports", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const rows = await db
      .select({ rapport: rapportTable, discipline: disciplineTable })
      .from(rapportTable)
      .leftJoin(disciplineTable, eq(rapportTable.idDiscipline, disciplineTable.ID))
      .where(and(eq(rapportTable.matricule, Number(req.params.id)), eq(rapportTable.isDelete, 0)));
    const rapports = rows.map(({ rapport, discipline }) => ({ ...rapport, discipline }));
    res.json(rapports);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT), requireEleveScope(), async (req, res) => {
  try {
    const rows = await db
      .select({ eleve: eleveTable, ville: villeNaissanceTable })
      .from(eleveTable)
      .leftJoin(villeNaissanceTable, eq(eleveTable.idVilleNaissance, villeNaissanceTable.idVille))
      .where(and(eq(eleveTable.matricule, Number(req.params.id)), eq(eleveTable.isDelete, 0)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Élève introuvable" }); return; }
    const [eleve] = await attachRelations([rows[0].eleve]);
    res.json({ ...eleve, ville: rows[0].ville });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { parent, inscription, villeNaissance, ...eleveBody } = req.body;

    const villeParsed = villeNaissanceInputSchema.safeParse(villeNaissance);
    if (!villeParsed.success) {
      res.status(400).json({ error: "Ville de naissance requise", details: villeParsed.error.flatten() });
      return;
    }

    // idVilleNaissance is resolved from villeParsed.data inside the transaction; the placeholder
    // here only satisfies insertEleveSchema's required field so the rest of the body can be validated.
    const eleveParsed = insertEleveSchema.safeParse({ ...eleveBody, idVilleNaissance: 0 });
    if (!eleveParsed.success) {
      res.status(400).json({ error: "Données élève invalides", details: eleveParsed.error.flatten() });
      return;
    }

    const inscriptionParsed = inscriptionSchema.safeParse(inscription);
    if (!inscriptionParsed.success) {
      res.status(400).json({ error: "Classe/salle d'affectation requise", details: inscriptionParsed.error.flatten() });
      return;
    }

    let parentParsed: z.infer<typeof parentSchema> | undefined;
    if (parent) {
      const result = parentSchema.safeParse(parent);
      if (!result.success) {
        res.status(400).json({ error: "Données parent invalides", details: result.error.flatten() });
        return;
      }
      parentParsed = result.data;
    }

    const now = new Date();
    const eleve = await db.transaction(async (tx) => {
      const { idVilleNaissance: _placeholder, ...eleveRest } = eleveParsed.data;
      const idVilleNaissance = await resolveVilleNaissance(tx, villeParsed.data);

      const [eleveResult] = await tx.insert(eleveTable).values({ ...eleveRest, idVilleNaissance, idAdmin: req.user!.id, created_at: now });
      const matricule = eleveResult.insertId;

      await tx.insert(frequenteTable).values({
        idSalle: inscriptionParsed.data.idSalle,
        idAcademi: inscriptionParsed.data.idAnnee,
        matricule,
        commentaire: inscriptionParsed.data.commentaire ?? "",
        idAdmin: req.user!.id,
        created_at: now,
      });

      if (parentParsed) {
        const hashed = await bcrypt.hash(parentParsed.password, 12);
        const [personneResult] = await tx.insert(personneTable).values({
          typePersonne: 2,
          password: hashed,
          idAdmin: req.user!.id,
          nom: parentParsed.nom,
          prenom: parentParsed.prenom,
          login: parentParsed.login,
          email: parentParsed.email || null,
          mobile: parentParsed.mobile || null,
          sexe: parentParsed.sexe ?? 0,
          actif: 1,
          created_at: now,
          createdAt: now,
          updatedAt: now,
        });
        await tx.insert(parentsTable).values({
          idPers: personneResult.insertId,
          matricule,
          idAdmin: req.user!.id,
          created_at: now,
          isDelete: 0,
        });
      }

      const [row] = await tx.select().from(eleveTable).where(eq(eleveTable.matricule, matricule)).limit(1);
      return row;
    });

    res.status(201).json({ message: "Élève créé avec succès", eleve });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Identifiant du parent déjà utilisé" }); return; }
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { matricule: _ignoredMatricule, villeNaissance, ...updatable } = req.body;
    if (typeof villeNaissance === "string" && villeNaissance.trim()) {
      updatable.idVilleNaissance = await resolveVilleNaissance(db, villeNaissance);
    }
    await db.update(eleveTable).set(updatable).where(eq(eleveTable.matricule, Number(req.params.id)));
    const rows = await db
      .select({ eleve: eleveTable, ville: villeNaissanceTable })
      .from(eleveTable)
      .leftJoin(villeNaissanceTable, eq(eleveTable.idVilleNaissance, villeNaissanceTable.idVille))
      .where(eq(eleveTable.matricule, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Élève introuvable" }); return; }
    const [eleve] = await attachRelations([rows[0].eleve]);
    res.json({ ...eleve, ville: rows[0].ville });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(eleveTable).set({ isDelete: 1 }).where(eq(eleveTable.matricule, Number(req.params.id)));
    res.json({ message: "Élève supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
