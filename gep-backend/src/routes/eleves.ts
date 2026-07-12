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
import PDFDocument from "pdfkit";
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

      const yearSuffix = String(now.getFullYear()).slice(-2);
      const matriculeCode = String(matricule).padStart(6, '0') + yearSuffix;
      await tx.update(eleveTable).set({ matriculeCode }).where(eq(eleveTable.matricule, matricule));

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

router.get("/:id/badge", authorize(ROLES.ADMINISTRATEUR, ROLES.PARENT, ROLES.ENSEIGNANT), requireEleveScope("id"), async (req, res) => {
  try {
    const matricule = Number(req.params.id);
    const [row] = await db
      .select({ eleve: eleveTable, ville: villeNaissanceTable })
      .from(eleveTable)
      .leftJoin(villeNaissanceTable, eq(eleveTable.idVilleNaissance, villeNaissanceTable.idVille))
      .where(eq(eleveTable.matricule, matricule))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Élève introuvable" }); return; }

    const el = row.eleve;
    const inscriptions = await db
      .select({ freq: frequenteTable, salle: salleTable, classe: classeTable })
      .from(frequenteTable)
      .leftJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
      .leftJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
      .where(eq(frequenteTable.matricule, matricule));
    const latestAnnee = await db
      .select().from(anneeAcademiqueTable)
      .where(eq(anneeAcademiqueTable.isDelete, 0))
      .orderBy(desc(anneeAcademiqueTable.idAnnee))
      .limit(1);
    const currentInscription = inscriptions.find((i) => latestAnnee[0] && i.freq.idAcademi === latestAnnee[0].idAnnee) || inscriptions[inscriptions.length - 1];
    const classeLibelle = currentInscription?.classe?.libelle || "—";
    const anneeLibelle = latestAnnee[0]?.libelle || new Date().getFullYear().toString();
    const nomEleve = `${el.nom ?? ""} ${el.prenom ?? ""}`.trim();
    const matriculeDisplay = el.matriculeCode || String(el.matricule).padStart(8, "0");
    const sexe = el.sexe === 1 ? "Masculin / Male" : el.sexe === 0 ? "Féminin / Female" : "—";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=badge_${matricule}.pdf`);

    const doc = new PDFDocument({ size: [340, 220], margin: 0 });
    doc.pipe(res);

    doc.rect(0, 0, 340, 220).fill("#ffffff");

    doc.rect(4, 4, 332, 212).lineWidth(3).stroke("#1b4332");
    doc.rect(8, 8, 324, 204).lineWidth(1).stroke("#d4af37");

    doc.rect(12, 12, 316, 50).fill("#1b4332");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(13).text("GROUPE SCOLAIRE BILINGUE GEP", 12, 20, { width: 316, align: "center" });
    doc.fontSize(8).font("Helvetica").text("BADGE D'ELEVE / STUDENT CARD", 12, 38, { width: 316, align: "center" });

    const yPhoto = 72;
    if (el.photoURL) {
      try {
        doc.image(el.photoURL, 24, yPhoto, { width: 60, height: 60 });
      } catch {
        doc.rect(24, yPhoto, 60, 60).fill("#e5e7eb");
        doc.fillColor("#9ca3af").font("Helvetica-Bold").fontSize(16)
          .text((el.nom?.[0] || "") + (el.prenom?.[0] || ""), 24, yPhoto + 20, { width: 60, align: "center" });
      }
    } else {
      doc.rect(24, yPhoto, 60, 60).fill("#1b4332");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20)
        .text((el.nom?.[0] || "") + (el.prenom?.[0] || ""), 24, yPhoto + 18, { width: 60, align: "center" });
    }

    const infoX = 96;
    doc.fillColor("#1b4332").font("Helvetica-Bold").fontSize(12).text(nomEleve, infoX, yPhoto, { width: 220 });
    doc.font("Helvetica").fontSize(9).fillColor("#333333");
    doc.text(`Matricule : ${matriculeDisplay}`, infoX, yPhoto + 18, { width: 220 });
    doc.text(`Classe : ${classeLibelle}`, infoX, yPhoto + 31, { width: 220 });
    doc.text(`Sexe : ${sexe}`, infoX, yPhoto + 44, { width: 220 });

    const yFooter = 148;
    doc.rect(12, yFooter, 316, 1).fill("#d4af37");

    doc.font("Helvetica").fontSize(8).fillColor("#666666");
    doc.text(`Annee scolaire / Academic year : ${anneeLibelle}`, 16, yFooter + 6, { width: 308, align: "center" });
    if (el.dateNaissance) {
      doc.text(`Ne(e) le / Date of birth : ${new Date(el.dateNaissance).toLocaleDateString("fr-FR")}`, 16, yFooter + 18, { width: 308, align: "center" });
    }
    doc.text(`Lieu : ${el.lieuNaissance || "—"}`, 16, yFooter + 30, { width: 308, align: "center" });

    doc.fontSize(7).fillColor("#999999")
      .text("GROUPE SCOLAIRE BILINGUE GEP  |  info@gep-ecole.cm  |  +237 699 100 000", 12, 198, { width: 316, align: "center" });

    doc.end();
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
