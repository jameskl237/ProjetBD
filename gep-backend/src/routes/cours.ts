import { Router } from "express";
import { db } from "@workspace/db";
import { coursTable, insertCoursSchema, enseignantTable, insertEnseignantSchema, emploiDuTempsTable, insertEmploiDuTempsSchema, titulaireTable, insertTitulaireSchema, personneTable, classeTable, cycleTable, frequenteTable, salleTable, anneeAcademiqueTable, evaluationTable, eleveTable, messagesTable } from "@workspace/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getEnseignantCoursIds, getParentClasseIds } from "../middlewares/scope.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate);

/**
 * RG05: an enseignant cannot be booked into two different salles for the same jour+heure.
 * The real teacher↔cours assignment lives in the Enseignant join table (idPers/idCours),
 * not Cours.idEnseignant (an unused legacy column), so conflicts must be resolved through it.
 */
async function findEmploiConflict(jour: string, heure: string, idCours: number, idSalle: number, excludeIdTemps?: number) {
  const enseignants = await db
    .select({ idPers: enseignantTable.idPers })
    .from(enseignantTable)
    .where(and(eq(enseignantTable.idCours, idCours), eq(enseignantTable.isDelete, 0)));
  const idPersList = enseignants.map((e) => e.idPers);
  if (idPersList.length === 0) return null;

  const sameSlot = await db
    .select({ emploi: emploiDuTempsTable, enseignant: enseignantTable })
    .from(emploiDuTempsTable)
    .innerJoin(coursTable, eq(emploiDuTempsTable.idCours, coursTable.idCours))
    .innerJoin(enseignantTable, and(eq(enseignantTable.idCours, coursTable.idCours), eq(enseignantTable.isDelete, 0)))
    .where(and(eq(emploiDuTempsTable.jour, jour), eq(emploiDuTempsTable.heure, heure), inArray(enseignantTable.idPers, idPersList)));

  return sameSlot.find((row) => row.emploi.idSalle !== idSalle && row.emploi.idTemps !== excludeIdTemps) ?? null;
}

router.get("/enseignants", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const rows = await db
      .select({ enseignant: enseignantTable, personne: personneTable, cours: coursTable, classe: classeTable })
      .from(enseignantTable)
      .leftJoin(personneTable, eq(enseignantTable.idPers, personneTable.idPers))
      .leftJoin(coursTable, eq(enseignantTable.idCours, coursTable.idCours))
      .leftJoin(classeTable, eq(coursTable.idClasse, classeTable.idClasse))
      .where(eq(enseignantTable.isDelete, 0));
    const ens = rows.map(({ enseignant, personne, cours, classe }) => ({
      ...enseignant,
      personne,
      cours: cours ? { ...cours, classe } : null,
    }));
    res.json(ens);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [e] = await db.select().from(enseignantTable).where(eq(enseignantTable.idEnseignant, Number(req.params.id))).limit(1);
    if (!e) { res.status(404).json({ error: "Enseignant introuvable" }); return; }
    res.json(e);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/enseignants", authorize(ROLES.ADMINISTRATEUR), validate(insertEnseignantSchema), async (req, res) => {
  try {
    await db.insert(enseignantTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Enseignant affecté avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(enseignantTable).set(req.body).where(eq(enseignantTable.idEnseignant, Number(req.params.id)));
    res.json({ message: "Enseignant mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/enseignants/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(enseignantTable).set({ isDelete: 1 }).where(eq(enseignantTable.idEnseignant, Number(req.params.id)));
    res.json({ message: "Enseignant retiré" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/enseignant/dashboard", authorize(ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const idPers = req.user!.id;

    const [profile] = await db
      .select({
        idPers: personneTable.idPers,
        nom: personneTable.nom,
        prenom: personneTable.prenom,
        login: personneTable.login,
        email: personneTable.email,
        mobile: personneTable.mobile,
        phone: personneTable.phone,
        sexe: personneTable.sexe,
        dateNaissance: personneTable.dateNaissance,
        lieuNaissance: personneTable.lieuNaissance,
        photoURL: personneTable.photoURL,
      })
      .from(personneTable)
      .where(eq(personneTable.idPers, idPers))
      .limit(1);

    const [titulaire] = await db
      .select({ idClasse: classeTable.idClasse, libelle: classeTable.libelle })
      .from(classeTable)
      .where(and(eq(classeTable.titulaire, idPers), eq(classeTable.isDelete, 0)))
      .limit(1);

    let nombreElevesTitulaire = 0;
    if (titulaire) {
      const [latestAnnee] = await db
        .select()
        .from(anneeAcademiqueTable)
        .where(eq(anneeAcademiqueTable.isDelete, 0))
        .orderBy(desc(anneeAcademiqueTable.idAnnee))
        .limit(1);

      if (latestAnnee) {
        const salles = await db
          .select({ idSalle: salleTable.idSalle })
          .from(salleTable)
          .where(eq(salleTable.idClasse, titulaire.idClasse));
        const salleIds = salles.map((s) => s.idSalle);
        if (salleIds.length > 0) {
          const rows = await db
            .select({ matricule: frequenteTable.matricule })
            .from(frequenteTable)
            .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee)));
          nombreElevesTitulaire = new Set(rows.map((r) => r.matricule)).size;
        }
      }
    }

    const classRows = await db
      .select({ idClasse: coursTable.idClasse })
      .from(enseignantTable)
      .innerJoin(coursTable, eq(enseignantTable.idCours, coursTable.idCours))
      .where(and(eq(enseignantTable.idPers, idPers), eq(enseignantTable.isDelete, 0)));
    const nombreDistinctClasses = new Set(classRows.map((r) => r.idClasse)).size;

    let repartitionNotes: { tranche: string; count: number }[] = [];
    if (titulaire) {
      const [latestAnnee] = await db
        .select()
        .from(anneeAcademiqueTable)
        .where(eq(anneeAcademiqueTable.isDelete, 0))
        .orderBy(desc(anneeAcademiqueTable.idAnnee))
        .limit(1);

      if (latestAnnee) {
        const salles = await db
          .select({ idSalle: salleTable.idSalle })
          .from(salleTable)
          .where(eq(salleTable.idClasse, titulaire.idClasse));
        const salleIds = salles.map((s) => s.idSalle);

        if (salleIds.length > 0) {
          const elevesInClass = await db
            .select({ matricule: frequenteTable.matricule })
            .from(frequenteTable)
            .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee)));
          const matricules = [...new Set(elevesInClass.map((r) => r.matricule))];

          if (matricules.length > 0) {
            const notes = await db
              .select({ note: evaluationTable.note })
              .from(evaluationTable)
              .where(inArray(evaluationTable.matricule, matricules));

            const tranches = [
              { tranche: '0 – 4.9', min: 0, max: 5, count: 0 },
              { tranche: '5 – 9.9', min: 5, max: 10, count: 0 },
              { tranche: '10 – 14.9', min: 10, max: 15, count: 0 },
              { tranche: '15 – 20', min: 15, max: 20.1, count: 0 },
            ];
            for (const n of notes) {
              const v = Number(n.note);
              for (const t of tranches) {
                if (v >= t.min && v < t.max) { t.count++; break; }
              }
            }
            repartitionNotes = tranches.map(({ tranche, count }) => ({ tranche, count }));
          }
        }
      }
    }

    let elevesTitulaire: { matricule: number; nom: string | null; prenom: string | null; sexe: number | null }[] = [];
    if (titulaire) {
      const [latestAnnee] = await db
        .select()
        .from(anneeAcademiqueTable)
        .where(eq(anneeAcademiqueTable.isDelete, 0))
        .orderBy(desc(anneeAcademiqueTable.idAnnee))
        .limit(1);

      if (latestAnnee) {
        const salles = await db
          .select({ idSalle: salleTable.idSalle })
          .from(salleTable)
          .where(eq(salleTable.idClasse, titulaire.idClasse));
        const salleIds = salles.map((s) => s.idSalle);

        if (salleIds.length > 0) {
          const rows = await db
            .select({ matricule: frequenteTable.matricule })
            .from(frequenteTable)
            .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee)));
          const matricules = [...new Set(rows.map((r) => r.matricule))];

          if (matricules.length > 0) {
            const eleves = await db
              .select({ matricule: eleveTable.matricule, nom: eleveTable.nom, prenom: eleveTable.prenom, sexe: eleveTable.sexe })
              .from(eleveTable)
              .where(and(inArray(eleveTable.matricule, matricules), eq(eleveTable.isDelete, 0)));
            elevesTitulaire = eleves;
          }
        }
      }
    }

    const derniersMessages = await db
      .select({ message: messagesTable, expediteur: personneTable })
      .from(messagesTable)
      .leftJoin(personneTable, eq(messagesTable.idExp_Pers, personneTable.idPers))
      .where(eq(messagesTable.idExp_Pers, idPers))
      .orderBy(desc(messagesTable.created_at))
      .limit(4);

    const messagesFormatted = derniersMessages.map(({ message, expediteur }) => ({
      idMessages: message.idMessages,
      objet: message.objet,
      information: message.information,
      created_at: message.created_at,
      isRead: message.isRead,
      expediteurNom: expediteur ? `${expediteur.prenom || ''} ${expediteur.nom || ''}`.trim() : null,
    }));

    const coursIds = await getEnseignantCoursIds(idPers);

    const evaluationsRecentes = coursIds.length > 0
      ? await db
          .select({
            idEval: evaluationTable.idEval,
            note: evaluationTable.note,
            appreciation: evaluationTable.appreciation,
            created_at: evaluationTable.created_at,
            matricule: evaluationTable.matricule,
            idCours: evaluationTable.idCours,
            nomEleve: eleveTable.nom,
            prenomEleve: eleveTable.prenom,
            coursLibelle: coursTable.libelle,
          })
          .from(evaluationTable)
          .innerJoin(eleveTable, eq(evaluationTable.matricule, eleveTable.matricule))
          .innerJoin(coursTable, eq(evaluationTable.idCours, coursTable.idCours))
          .where(and(eq(evaluationTable.idPers, idPers), eq(eleveTable.isDelete, 0)))
          .orderBy(desc(evaluationTable.created_at))
          .limit(8)
      : [];

    const edtRows = coursIds.length > 0
      ? await db
          .select({
            jour: emploiDuTempsTable.jour,
            heure: emploiDuTempsTable.heure,
            coursLibelle: coursTable.libelle,
            classeLibelle: classeTable.libelle,
          })
          .from(emploiDuTempsTable)
          .innerJoin(coursTable, eq(emploiDuTempsTable.idCours, coursTable.idCours))
          .innerJoin(classeTable, eq(emploiDuTempsTable.idClasse, classeTable.idClasse))
          .where(inArray(emploiDuTempsTable.idCours, coursIds))
      : [];

    const JOUR_ORDRE: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 7 };
    const heuresParJour: { jour: string; heures: number }[] = [];
    const slotsByJour = new Map<string, Set<string>>();
    for (const row of edtRows) {
      if (!slotsByJour.has(row.jour)) slotsByJour.set(row.jour, new Set());
      slotsByJour.get(row.jour)!.add(row.heure);
    }
    const allJours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    for (const jour of allJours) {
      heuresParJour.push({ jour, heures: slotsByJour.get(jour)?.size ?? 0 });
    }

    res.json({
      profile,
      classeTitulaire: titulaire ?? null,
      nombreElevesTitulaire,
      nombreDistinctClasses,
      repartitionNotes,
      elevesTitulaire,
      messages: messagesFormatted,
      evaluationsRecentes,
      emploiDuTemps: edtRows,
      heuresParJour,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/emploi-du-temps", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT), async (req, res) => {
  try {
    const edt = await db.select().from(emploiDuTempsTable);
    const role = getRole(req.user);
    if (role === ROLES.ENSEIGNANT) {
      const coursIds = new Set(await getEnseignantCoursIds(req.user!.id));
      res.json(edt.filter((e) => coursIds.has(e.idCours)));
      return;
    }
    if (role === ROLES.PARENT) {
      const classeIds = new Set(await getParentClasseIds(req.user!.id));
      res.json(edt.filter((e) => classeIds.has(e.idClasse)));
      return;
    }
    res.json(edt);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/emploi-du-temps", authorize(ROLES.ADMINISTRATEUR), validate(insertEmploiDuTempsSchema), async (req, res) => {
  try {
    const { jour, heure, idCours, idSalle } = req.body;
    const conflict = await findEmploiConflict(jour, heure, idCours, idSalle);
    if (conflict) { res.status(409).json({ error: "Conflit d'emploi du temps : cet enseignant est déjà affecté à une autre salle sur ce créneau" }); return; }
    await db.insert(emploiDuTempsTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Créneau ajouté" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/emploi-du-temps/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const idTemps = Number(req.params.id);
    const [current] = await db.select().from(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, idTemps)).limit(1);
    if (!current) { res.status(404).json({ error: "Créneau introuvable" }); return; }
    const jour = req.body.jour ?? current.jour;
    const heure = req.body.heure ?? current.heure;
    const idCours = req.body.idCours ?? current.idCours;
    const idSalle = req.body.idSalle ?? current.idSalle;
    const conflict = await findEmploiConflict(jour, heure, idCours, idSalle, idTemps);
    if (conflict) { res.status(409).json({ error: "Conflit d'emploi du temps : cet enseignant est déjà affecté à une autre salle sur ce créneau" }); return; }
    await db.update(emploiDuTempsTable).set(req.body).where(eq(emploiDuTempsTable.idTemps, idTemps));
    const [edt] = await db.select().from(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, idTemps)).limit(1);
    res.json(edt);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/emploi-du-temps/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(emploiDuTempsTable).where(eq(emploiDuTempsTable.idTemps, Number(req.params.id)));
    res.json({ message: "Créneau supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/titulaires", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const tit = await db.select().from(titulaireTable);
    res.json(tit);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/titulaires", authorize(ROLES.ADMINISTRATEUR), validate(insertTitulaireSchema), async (req, res) => {
  try {
    await db.insert(titulaireTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Titulaire affecté" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [t] = await db.select().from(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id))).limit(1);
    if (!t) { res.status(404).json({ error: "Titulaire introuvable" }); return; }
    res.json(t);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(titulaireTable).set(req.body).where(eq(titulaireTable.idTitulaire, Number(req.params.id)));
    const [t] = await db.select().from(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id))).limit(1);
    if (!t) { res.status(404).json({ error: "Titulaire introuvable" }); return; }
    res.json(t);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/titulaires/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(titulaireTable).where(eq(titulaireTable.idTitulaire, Number(req.params.id)));
    res.json({ message: "Titulaire supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (_req, res) => {
  try {
    const rows = await db
      .select({
        cours: coursTable,
        classe: classeTable,
        cycle: cycleTable,
      })
      .from(coursTable)
      .leftJoin(classeTable, eq(coursTable.idClasse, classeTable.idClasse))
      .leftJoin(cycleTable, eq(classeTable.idCycle, cycleTable.idCycle))
      .where(eq(coursTable.isDelete, 0));

    const enriched = await Promise.all(rows.map(async ({ cours, classe, cycle }) => {
      const enseignants = await db
        .select({ idPers: enseignantTable.idPers, nom: personneTable.nom, prenom: personneTable.prenom })
        .from(enseignantTable)
        .innerJoin(personneTable, eq(enseignantTable.idPers, personneTable.idPers))
        .where(and(eq(enseignantTable.idCours, cours.idCours), eq(enseignantTable.isDelete, 0)));
      return {
        ...cours,
        classe: classe ? { idClasse: classe.idClasse, libelle: classe.libelle } : null,
        section: cycle?.libelle ?? null,
        enseignants,
      };
    }));

    res.json(enriched);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [c] = await db.select().from(coursTable).where(eq(coursTable.idCours, Number(req.params.id))).limit(1);
    if (!c) { res.status(404).json({ error: "Cours introuvable" }); return; }
    res.json(c);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR), validate(insertCoursSchema), async (req, res) => {
  try {
    await db.insert(coursTable).values({ ...req.body, idAdmin: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Cours créé avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(coursTable).set(req.body).where(eq(coursTable.idCours, Number(req.params.id)));
    const [c] = await db.select().from(coursTable).where(eq(coursTable.idCours, Number(req.params.id))).limit(1);
    if (!c) { res.status(404).json({ error: "Cours introuvable" }); return; }
    res.json(c);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(coursTable).set({ isDelete: 1 }).where(eq(coursTable.idCours, Number(req.params.id)));
    res.json({ message: "Cours supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
