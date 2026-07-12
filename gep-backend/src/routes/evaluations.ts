import { Router } from "express";
import { db } from "@workspace/db";
import { evaluationTable, sessionTable, epreuveTable, natureEpreuveTable, insertNatureEpreuveSchema, eleveTable, coursTable, villeNaissanceTable, trimestreTable, personneTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { requireEleveScope, getEnseignantCoursIds, getParentMatricules } from "../middlewares/scope.ts";
import { validate } from "../middlewares/validate.ts";

const router = Router();
router.use(authenticate);

router.get("/sessions", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.SECRETAIRE), async (_req, res) => {
  try {
    const rows = await db
      .select({ session: sessionTable, trimestre: trimestreTable, personne: personneTable })
      .from(sessionTable)
      .leftJoin(trimestreTable, eq(sessionTable.idTrimestre, trimestreTable.idTrimes))
      .leftJoin(personneTable, eq(sessionTable.idPers, personneTable.idPers));
    const sessions = rows.map(({ session, trimestre, personne }) => ({ ...session, trimestre, responsable: personne }));
    res.json(sessions);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/sessions", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, description, idTrimestre, idPers, date_passage } = req.body;
    if (!libelle || !idTrimestre || !idPers) {
      res.status(400).json({ error: "Champs requis: libelle, idTrimestre, idPers" }); return;
    }
    await db.insert(sessionTable).values({ libelle, description: description ?? "", idTrimestre, idPers, date_passage, created_at: new Date() });
    res.status(201).json({ message: "Session créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/sessions/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, description, date_passage } = req.body;
    const data: Record<string, unknown> = {};
    if (libelle !== undefined) data.libelle = libelle;
    if (description !== undefined) data.description = description;
    if (date_passage !== undefined) data.date_passage = date_passage;
    if (Object.keys(data).length > 0) {
      await db.update(sessionTable).set(data).where(eq(sessionTable.idSession, Number(req.params.id)));
    }
    res.json({ message: "Session mise à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/sessions/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(sessionTable).where(eq(sessionTable.idSession, Number(req.params.id)));
    res.json({ message: "Session supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/epreuves", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.SECRETAIRE), async (_req, res) => {
  try {
    const rows = await db
      .select({ epreuve: epreuveTable, nature: natureEpreuveTable })
      .from(epreuveTable)
      .leftJoin(natureEpreuveTable, eq(epreuveTable.idNature, natureEpreuveTable.idNature))
      .where(eq(epreuveTable.isDelete, 0));
    const epreuves = rows.map(({ epreuve, nature }) => ({ ...epreuve, nature }));
    res.json(epreuves);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/epreuves", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const { libelle, idNature, urlDoc, auteur } = req.body;
    if (!libelle || !idNature) { res.status(400).json({ error: "libelle et idNature requis" }); return; }
    await db.insert(epreuveTable).values({ libelle, idNature, urlDoc: urlDoc ?? "", auteur: auteur ?? "", idPers: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Épreuve créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/epreuves/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const { libelle, idNature, urlDoc, auteur } = req.body;
    const data: Record<string, unknown> = {};
    if (libelle !== undefined) data.libelle = libelle;
    if (idNature !== undefined) data.idNature = idNature;
    if (urlDoc !== undefined) data.urlDoc = urlDoc;
    if (auteur !== undefined) data.auteur = auteur;
    if (Object.keys(data).length > 0) {
      await db.update(epreuveTable).set(data).where(eq(epreuveTable.idEpreuve, Number(req.params.id)));
    }
    const [ep] = await db.select().from(epreuveTable).where(eq(epreuveTable.idEpreuve, Number(req.params.id))).limit(1);
    if (!ep) { res.status(404).json({ error: "Épreuve introuvable" }); return; }
    res.json(ep);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/epreuves/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(epreuveTable).set({ isDelete: 1 }).where(eq(epreuveTable.idEpreuve, Number(req.params.id)));
    res.json({ message: "Épreuve supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/epreuves/:id/valider", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.update(epreuveTable).set({ valider: 1 }).where(eq(epreuveTable.idEpreuve, Number(req.params.id)));
    res.json({ message: "Épreuve validée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/epreuves/:id/rejeter", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.update(epreuveTable).set({ valider: 0 }).where(eq(epreuveTable.idEpreuve, Number(req.params.id)));
    res.json({ message: "Épreuve rejetée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/natures", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.SECRETAIRE), async (_req, res) => {
  try {
    const natures = await db.select().from(natureEpreuveTable);
    res.json(natures);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/natures", authorize(ROLES.ADMINISTRATEUR), validate(insertNatureEpreuveSchema), async (req, res) => {
  try {
    await db.insert(natureEpreuveTable).values(req.body);
    res.status(201).json({ message: "Nature d'épreuve créée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

async function buildBulletin(matricule: number) {
  const [eleveRow] = await db
    .select({ eleve: eleveTable, ville: villeNaissanceTable })
    .from(eleveTable)
    .leftJoin(villeNaissanceTable, eq(eleveTable.idVilleNaissance, villeNaissanceTable.idVille))
    .where(eq(eleveTable.matricule, matricule))
    .limit(1);
  if (!eleveRow) return null;
  const eleve = { ...eleveRow.eleve, ville: eleveRow.ville };

  const evaluations = await db.select().from(evaluationTable).where(eq(evaluationTable.matricule, matricule));
  const sessions = await db.select().from(sessionTable);
  const epreuves = await db.select().from(epreuveTable);
  const cours = await db.select().from(coursTable);

  const sessionsMap = Object.fromEntries(sessions.map(s => [s.idSession, s]));
  const epreuvesMap = Object.fromEntries(epreuves.map(e => [e.idEpreuve, e]));
  const coursMap = Object.fromEntries(cours.map(c => [c.idCours, c]));

  const bySession: Record<number, { session: typeof sessions[0]; lignes: Array<{ cours: string; coef: number; note: number; appreciation: string }> }> = {};

  for (const ev of evaluations) {
    const sid = ev.idSession ?? 0;
    if (!bySession[sid]) {
      bySession[sid] = { session: sessionsMap[sid] ?? { idSession: sid, libelle: "Session " + sid, description: "", idTrimestre: 0, idPers: 0, date_passage: null, created_at: new Date() }, lignes: [] };
    }
    const c = coursMap[ev.idCours ?? 0];
    bySession[sid]!.lignes.push({
      cours: c?.libelle ?? "Cours " + ev.idCours,
      coef: Number(c?.coefficient ?? 1),
      note: Number(ev.note ?? 0),
      appreciation: ev.appreciation ?? "",
    });
  }

  const sessionsResult = Object.values(bySession).map(s => {
    const totalCoef = s.lignes.reduce((acc, l) => acc + l.coef, 0);
    const totalPoints = s.lignes.reduce((acc, l) => acc + l.note * l.coef, 0);
    const moyenne = totalCoef > 0 ? Math.round((totalPoints / totalCoef) * 100) / 100 : 0;
    return { session: s.session.libelle, lignes: s.lignes, moyenne };
  });

  const moyenneGenerale = sessionsResult.length > 0
    ? Math.round((sessionsResult.reduce((a, s) => a + s.moyenne, 0) / sessionsResult.length) * 100) / 100
    : 0;

  return { eleve, sessions: sessionsResult, moyenneGenerale };
}

router.get("/bulletin/:matricule", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.COMPTABLE, ROLES.SECRETAIRE), requireEleveScope("matricule"), async (req, res) => {
  try {
    const bulletin = await buildBulletin(Number(req.params.matricule));
    if (!bulletin) { res.status(404).json({ error: "Élève introuvable" }); return; }
    res.json(bulletin);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/bulletin/:matricule/export", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.COMPTABLE, ROLES.SECRETAIRE), requireEleveScope("matricule"), async (req, res) => {
  try {
    const { format = "pdf" } = req.query as { format?: string };
    const bulletin = await buildBulletin(Number(req.params.matricule));
    if (!bulletin) { res.status(404).json({ error: "Élève introuvable" }); return; }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=bulletin_${req.params.matricule}.csv`);
      const lines = ["Session;Cours;Coefficient;Note;Appreciation"];
      for (const s of bulletin.sessions) {
        for (const l of s.lignes) {
          lines.push([s.session, l.cours, l.coef, l.note, l.appreciation.replace(/;/g, ",")].join(";"));
        }
        lines.push([s.session, "MOYENNE SESSION", "", s.moyenne, ""].join(";"));
      }
      lines.push(["MOYENNE GENERALE", "", "", bulletin.moyenneGenerale, ""].join(";"));
      res.send(lines.join("\n"));
      return;
    }

    // PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bulletin_${req.params.matricule}.pdf`);
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    const el = bulletin.eleve as any;
    const nomEleve = `${el.nom ?? ""} ${el.prenom ?? ""}`.trim();
    const sexe = el.sexe === 1 ? "M" : el.sexe === 2 ? "F" : "-";

    doc.fontSize(16).font("Helvetica-Bold").text("BULLETIN DE NOTES", { align: "center" });
    doc.fontSize(11).font("Helvetica-Bold").text("GEP — Gestion d'Établissement de Formation", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica-Bold").text("INFORMATIONS ÉLÈVE", { underline: true });
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Matricule : ${el.matricule}   |   Nom : ${nomEleve}   |   Sexe : ${sexe}`);
    if (el.dateNaissance) doc.text(`Date de naissance : ${new Date(el.dateNaissance).toLocaleDateString("fr-FR")}`);
    doc.moveDown(0.8);

    for (const s of bulletin.sessions) {
      doc.fontSize(11).font("Helvetica-Bold").text(`Session : ${s.session}`, { underline: true });
      doc.moveDown(0.3);

      const colX = [40, 260, 330, 390, 460];
      doc.fontSize(8).font("Helvetica-Bold");
      ["Cours", "Coefficient", "Note /20", "Pts pondérés", "Appréciation"].forEach((h, i) => {
        doc.text(h, colX[i]!, doc.y, { width: (colX[i + 1] ?? 555) - colX[i]!, lineBreak: false });
      });
      doc.moveDown(0.4);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.2);

      doc.font("Helvetica").fontSize(8);
      for (const l of s.lignes) {
        const y = doc.y;
        const pts = Math.round(l.note * l.coef * 100) / 100;
        [l.cours.slice(0, 30), String(l.coef), String(l.note), String(pts), l.appreciation.slice(0, 18)].forEach((v, i) => {
          doc.text(v, colX[i]!, y, { width: (colX[i + 1] ?? 555) - colX[i]!, lineBreak: false });
        });
        doc.moveDown(0.55);
        if (doc.y > 740) { doc.addPage(); doc.font("Helvetica").fontSize(8); }
      }
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      const mention = s.moyenne >= 16 ? "Très Bien" : s.moyenne >= 14 ? "Bien" : s.moyenne >= 12 ? "Assez Bien" : s.moyenne >= 10 ? "Passable" : "Insuffisant";
      doc.fontSize(9).font("Helvetica-Bold").text(`Moyenne de session : ${s.moyenne}/20  —  ${mention}`, { align: "right" });
      doc.moveDown(0.8);
    }

    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).stroke();
    doc.moveDown(0.4);
    const mG = bulletin.moyenneGenerale;
    const mentionG = mG >= 16 ? "Très Bien" : mG >= 14 ? "Bien" : mG >= 12 ? "Assez Bien" : mG >= 10 ? "Passable" : "Insuffisant";
    const decisionG = mG >= 10 ? "ADMIS(E)" : "À REPRENDRE";
    doc.fontSize(12).font("Helvetica-Bold")
      .text(`MOYENNE GÉNÉRALE : ${mG}/20  —  ${mentionG}  —  ${decisionG}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica").fillColor("#666")
      .text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, { align: "center" });
    doc.end();
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE), async (req, res) => {
  try {
    const evs = await db.select().from(evaluationTable);
    const role = getRole(req.user);
    if (role === ROLES.ENSEIGNANT) { res.json(evs.filter((e) => e.idPers === req.user!.id)); return; }
    if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      res.json(evs.filter((e) => matricules.includes(e.matricule)));
      return;
    }
    res.json(evs);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE), async (req, res) => {
  try {
    const [ev] = await db.select().from(evaluationTable).where(eq(evaluationTable.idEval, Number(req.params.id))).limit(1);
    if (!ev) { res.status(404).json({ error: "Évaluation introuvable" }); return; }
    const role = getRole(req.user);
    if (role === ROLES.ENSEIGNANT && ev.idPers !== req.user!.id) { res.status(403).json({ error: "Accès refusé" }); return; }
    if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      if (!matricules.includes(ev.matricule)) { res.status(403).json({ error: "Accès refusé" }); return; }
    }
    res.json(ev);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const { note, appreciation, matricule, idEpreuve, idCours, idSession } = req.body;
    if (!matricule || !idEpreuve || !idCours || !idSession) {
      res.status(400).json({ error: "Champs requis: matricule, idEpreuve, idCours, idSession" }); return;
    }
    const coursIds = await getEnseignantCoursIds(req.user!.id);
    if (!coursIds.includes(Number(idCours))) { res.status(403).json({ error: "Vous n'enseignez pas ce cours" }); return; }
    await db.insert(evaluationTable).values({ note: note ?? 0, appreciation: appreciation ?? "", matricule, idEpreuve, idCours, idSession, idPers: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Évaluation enregistrée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [existing] = await db.select().from(evaluationTable).where(eq(evaluationTable.idEval, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Évaluation introuvable" }); return; }
    if (existing.idPers !== req.user!.id) { res.status(403).json({ error: "Vous ne pouvez modifier que vos propres évaluations" }); return; }
    const { note, appreciation, valider } = req.body;
    const data: Record<string, unknown> = {};
    if (note !== undefined) data.note = note;
    if (appreciation !== undefined) data.appreciation = appreciation;
    if (valider !== undefined) data.valider = valider;
    if (Object.keys(data).length > 0) {
      await db.update(evaluationTable).set(data).where(eq(evaluationTable.idEval, Number(req.params.id)));
    }
    const [ev] = await db.select().from(evaluationTable).where(eq(evaluationTable.idEval, Number(req.params.id))).limit(1);
    res.json(ev);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const [existing] = await db.select().from(evaluationTable).where(eq(evaluationTable.idEval, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Évaluation introuvable" }); return; }
    if (existing.idPers !== req.user!.id) { res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres évaluations" }); return; }
    await db.delete(evaluationTable).where(eq(evaluationTable.idEval, Number(req.params.id)));
    res.json({ message: "Évaluation supprimée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/valider", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.update(evaluationTable).set({ valider: 1 }).where(eq(evaluationTable.idEval, Number(req.params.id)));
    res.json({ message: "Note validée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/rejeter", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.update(evaluationTable).set({ valider: 0 }).where(eq(evaluationTable.idEval, Number(req.params.id)));
    res.json({ message: "Note rejetée" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
