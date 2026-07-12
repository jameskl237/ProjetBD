import { Router } from "express";
import { db } from "@workspace/db";
import { paiementTable, modeTable, eleveTable, anneeAcademiqueTable, frequenteTable, salleTable, classeTable, scolariteTable, tranchesTable } from "@workspace/db/schema";
import { eq, and, inArray, desc, type SQL } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";
import { getParentMatricules, requireEleveScope } from "../middlewares/scope.ts";
import { getTrancheStatutForEleve } from "../lib/tranches.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT));

/** Classe actuellement fréquentée par l'élève pour une année donnée (dernière inscription connue sinon). */
async function getEleveClasseId(matricule: number, idAca: number): Promise<number | null> {
  const rows = await db
    .select({ idClasse: classeTable.idClasse, idAcademi: frequenteTable.idAcademi })
    .from(frequenteTable)
    .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
    .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
    .where(eq(frequenteTable.matricule, matricule))
    .orderBy(desc(frequenteTable.idFrequente));
  if (rows.length === 0) return null;
  return (rows.find((r) => r.idAcademi === idAca) ?? rows[0])!.idClasse;
}

async function paiementsWithRelations(where?: SQL) {
  const query = db
    .select({ paiement: paiementTable, eleve: eleveTable, annee: anneeAcademiqueTable, mode: modeTable })
    .from(paiementTable)
    .leftJoin(eleveTable, eq(paiementTable.matricule, eleveTable.matricule))
    .leftJoin(anneeAcademiqueTable, eq(paiementTable.idAca, anneeAcademiqueTable.idAnnee))
    .leftJoin(modeTable, eq(paiementTable.idMode, modeTable.idMode));
  const rows = where ? await query.where(where) : await query;

  const pairs = [...new Set(rows.map((r) => `${r.paiement.matricule}-${r.paiement.idAca}`))];
  const matricules = [...new Set(rows.map((r) => r.paiement.matricule))];
  const inscriptionRows = matricules.length === 0 ? [] : await db
    .select({ frequente: frequenteTable, classe: classeTable })
    .from(frequenteTable)
    .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
    .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
    .where(inArray(frequenteTable.matricule, matricules));
  const classeByPair = new Map<string, typeof classeTable.$inferSelect>();
  for (const row of inscriptionRows) {
    const key = `${row.frequente.matricule}-${row.frequente.idAcademi}`;
    if (pairs.includes(key)) classeByPair.set(key, row.classe);
  }

  return rows.map(({ paiement, eleve, annee, mode }) => ({
    ...paiement,
    eleve,
    annee,
    mode,
    classe: classeByPair.get(`${paiement.matricule}-${paiement.idAca}`) ?? null,
  }));
}

router.get("/modes/list", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const modes = await db.select().from(modeTable);
    res.json(modes);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/modes", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    const { libelle, information } = req.body;
    if (!libelle) { res.status(400).json({ error: "libelle requis" }); return; }
    await db.insert(modeTable).values({ libelle, information: information ?? "", actif: 1, idFondateur: req.user!.id, created_at: new Date() });
    res.status(201).json({ message: "Mode de paiement créé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/modes/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.update(modeTable).set(req.body).where(eq(modeTable.idMode, Number(req.params.id)));
    res.json({ message: "Mode de paiement mis à jour" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/modes/:id", authorize(ROLES.ADMINISTRATEUR), async (req, res) => {
  try {
    await db.delete(modeTable).where(eq(modeTable.idMode, Number(req.params.id)));
    res.json({ message: "Mode supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/export", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT), async (req, res) => {
  try {
    const { format = "csv", matricule } = req.query as Record<string, string>;
    const role = getRole(req.user);
    let where: SQL | undefined = matricule ? eq(paiementTable.matricule, Number(matricule)) : undefined;
    if (role === ROLES.PARENT) {
      const matricules = await getParentMatricules(req.user!.id);
      if (matricule && !matricules.includes(Number(matricule))) { res.status(403).json({ error: "Accès refusé" }); return; }
      if (!matricule) where = matricules.length === 0 ? eq(paiementTable.matricule, -1) : inArray(paiementTable.matricule, matricules);
    }
    const paiements = await paiementsWithRelations(where);

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=paiements.pdf");
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.pipe(res);

      doc.fontSize(18).font("Helvetica-Bold").text("GEP — Relevé des Paiements", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — ${paiements.length} paiement(s)`, { align: "center" });
      doc.moveDown(1);

      const colX = [40, 100, 200, 290, 360, 430, 490];
      const headers = ["ID", "Matricule", "Élève", "Montant (F)", "Date", "Mode", "Commentaire"];
      doc.fontSize(8).font("Helvetica-Bold");
      headers.forEach((h, i) => doc.text(h, colX[i]!, doc.y, { width: (colX[i + 1] ?? 560) - colX[i]!, lineBreak: false }));
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font("Helvetica").fontSize(7);
      let total = 0;
      for (const p of paiements) {
        const y = doc.y;
        const eleve = p.eleve as any;
        const mode = p.mode as any;
        const nom = eleve ? `${eleve.nom ?? ""} ${eleve.prenom ?? ""}`.trim() : "-";
        const montant = Number(p.montant ?? 0);
        total += montant;
        const row = [
          String(p.idPaie),
          String(p.matricule),
          nom.slice(0, 22),
          montant.toLocaleString("fr-FR"),
          p.datePaie ? new Date(p.datePaie).toLocaleDateString("fr-FR") : "-",
          mode?.libelle ?? "-",
          (p.comentaire ?? "").slice(0, 20),
        ];
        row.forEach((val, i) => doc.text(val, colX[i]!, y, { width: (colX[i + 1] ?? 560) - colX[i]!, lineBreak: false }));
        doc.moveDown(0.6);
        if (doc.y > 750) { doc.addPage(); doc.font("Helvetica").fontSize(7); }
      }
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").fontSize(9).text(`TOTAL : ${total.toLocaleString("fr-FR")} FCFA`, { align: "right" });
      doc.end();
      return;
    }

    // CSV
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=paiements.csv");
    const lines: string[] = ["ID;Matricule;Nom;Prenom;Montant;Date;Mode;Annee;Commentaire;Operation"];
    for (const p of paiements) {
      const eleve = p.eleve as any;
      const mode = p.mode as any;
      const annee = p.annee as any;
      lines.push([
        p.idPaie,
        p.matricule,
        eleve?.nom ?? "",
        eleve?.prenom ?? "",
        p.montant ?? 0,
        p.datePaie ? new Date(p.datePaie).toLocaleDateString("fr-FR") : "",
        mode?.libelle ?? "",
        annee?.libelle ?? "",
        (p.comentaire ?? "").replace(/;/g, ","),
        p.operation_ID ?? "",
      ].join(";"));
    }
    res.send(lines.join("\n"));
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/impayes", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const [latestAnnee] = await db
      .select()
      .from(anneeAcademiqueTable)
      .where(eq(anneeAcademiqueTable.isDelete, 0))
      .orderBy(desc(anneeAcademiqueTable.idAnnee))
      .limit(1);
    if (!latestAnnee) { res.json([]); return; }

    const roster = await db
      .select({ frequente: frequenteTable, eleve: eleveTable, classe: classeTable })
      .from(frequenteTable)
      .innerJoin(eleveTable, eq(frequenteTable.matricule, eleveTable.matricule))
      .innerJoin(salleTable, eq(frequenteTable.idSalle, salleTable.idSalle))
      .innerJoin(classeTable, eq(salleTable.idClasse, classeTable.idClasse))
      .where(eq(frequenteTable.idAcademi, latestAnnee.idAnnee));

    const [scolarites, tranches, paiements] = await Promise.all([
      db.select().from(scolariteTable),
      db.select().from(tranchesTable),
      db.select().from(paiementTable).where(eq(paiementTable.idAca, latestAnnee.idAnnee)),
    ]);

    const scolariteByCycle = new Map(scolarites.map((s) => [s.idCycle, s]));
    const tranchesByScolarite = new Map<number, typeof tranches>();
    for (const t of tranches) {
      if (!tranchesByScolarite.has(t.idScolarite)) tranchesByScolarite.set(t.idScolarite, []);
      tranchesByScolarite.get(t.idScolarite)!.push(t);
    }
    const paidByMatricule = new Map<number, number>();
    for (const p of paiements) {
      paidByMatricule.set(p.matricule, (paidByMatricule.get(p.matricule) ?? 0) + Number(p.montant));
    }

    const today = new Date();
    const impayes = [];
    for (const row of roster) {
      const scolarite = scolariteByCycle.get(row.classe.idCycle);
      if (!scolarite) continue;
      const attendu = Number(scolarite.inscription) + Number(scolarite.pension);
      const paye = paidByMatricule.get(row.eleve.matricule) ?? 0;
      const solde = attendu - paye;
      if (solde <= 0) continue;

      const scolariteTranches = tranchesByScolarite.get(scolarite.idScolarite) ?? [];
      let echeance: Date | null = null;
      for (const t of scolariteTranches) {
        const mois = Number(t.delai_mois);
        const jour = Number(t.delai_jour);
        if (!mois || !jour) continue;
        const date = new Date(today.getFullYear(), mois - 1, jour);
        if (!echeance || date > echeance) echeance = date;
      }
      const retard = echeance && today > echeance ? Math.floor((today.getTime() - echeance.getTime()) / 86400000) : 0;

      impayes.push({
        matricule: row.eleve.matricule,
        eleve: row.eleve,
        classe: row.classe,
        montantDu: solde,
        echeance,
        retard,
      });
    }

    res.json(impayes.sort((a, b) => b.retard - a.retard));
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

/** Les 3 tranches (montant dû / payé / restant) de l'élève pour l'année donnée. Génère les tranches si besoin. */
router.get("/statut/:matricule", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT), requireEleveScope("matricule"), async (req, res) => {
  try {
    const matricule = Number(req.params.matricule);
    let idAca = Number(req.query.idAca);
    if (!idAca) {
      const [latest] = await db.select().from(anneeAcademiqueTable).orderBy(desc(anneeAcademiqueTable.idAnnee)).limit(1);
      if (!latest) { res.status(404).json({ error: "Aucune année académique trouvée" }); return; }
      idAca = latest.idAnnee;
    }
    const idClasse = await getEleveClasseId(matricule, idAca);
    if (!idClasse) { res.status(404).json({ error: "Aucune inscription trouvée pour cet élève" }); return; }
    const statut = await getTrancheStatutForEleve(matricule, idClasse, idAca);
    if (!statut) { res.status(404).json({ error: "Aucune pension configurée pour la classe de cet élève" }); return; }
    res.json({ idClasse, tranches: statut });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/eleve/:matricule", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT), requireEleveScope("matricule"), async (req, res) => {
  try {
    const paiements = await paiementsWithRelations(eq(paiementTable.matricule, Number(req.params.matricule)));
    const total = paiements.reduce((s, p) => s + Number(p.montant ?? 0), 0);
    res.json({ paiements, total });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (_req, res) => {
  try {
    const paiements = await paiementsWithRelations();
    res.json(paiements);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE), async (req, res) => {
  try {
    const [p] = await paiementsWithRelations(eq(paiementTable.idPaie, Number(req.params.id)));
    if (!p) { res.status(404).json({ error: "Paiement introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id/recu", authorize(ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.PARENT), async (req, res) => {
  try {
    const idPaie = Number(req.params.id);
    const [p] = await paiementsWithRelations(eq(paiementTable.idPaie, idPaie));
    if (!p) { res.status(404).json({ error: "Paiement introuvable" }); return; }

    const role = getRole(req.user);
    if (role === ROLES.PARENT) {
      const parentMatricules = await getParentMatricules(req.user!.id);
      if (!parentMatricules.includes(p.matricule)) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=recu_${idPaie}.pdf`);

    const doc = new PDFDocument({ size: "A5", layout: "landscape", margin: 25 });
    doc.pipe(res);

    // Forest green border and Gold interior border
    doc.rect(12, 12, doc.page.width - 24, doc.page.height - 24).lineWidth(3).stroke("#1b4332");
    doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).lineWidth(1).stroke("#d4af37");

    // Header Title
    doc.fillColor("#1b4332").fontSize(14).font("Helvetica-Bold").text("GROUPE SCOLAIRE BILINGUE GEP", 30, 28);
    doc.fillColor("#555555").fontSize(7.5).font("Helvetica").text("Email: info@gep-ecole.cm  |  Tél: +237 699 100 000", 30, 42);

    doc.fillColor("#d4af37").fontSize(12).font("Helvetica-Bold").text("REÇU DE PAIEMENT", 30, 60, { align: "center" });

    // Line separator
    doc.moveTo(30, 78).lineTo(doc.page.width - 30, 78).strokeColor("#1b4332").lineWidth(1).stroke();

    // Data layout
    const eleve = p.eleve as any;
    const nomEleve = eleve ? `${eleve.nom || ""} ${eleve.prenom || ""}`.trim() : "-";
    const mode = p.mode as any;
    const annee = p.annee as any;

    doc.fillColor("#000000").fontSize(9.5);
    
    // Left column
    doc.font("Helvetica-Bold").text("Reçu N° :", 30, 92);
    doc.font("Helvetica").text(String(p.idPaie), 110, 92);

    doc.font("Helvetica-Bold").text("Date :", 30, 107);
    doc.font("Helvetica").text(p.datePaie ? new Date(p.datePaie).toLocaleDateString("fr-FR") : "-", 110, 107);

    doc.font("Helvetica-Bold").text("Élève :", 30, 122);
    doc.font("Helvetica").text(`${nomEleve} (Matricule: ${String(p.matricule).padStart(8, '0')})`, 110, 122);

    doc.font("Helvetica-Bold").text("Classe :", 30, 137);
    doc.font("Helvetica").text(p.classe?.libelle || "-", 110, 137);

    // Right column
    doc.font("Helvetica-Bold").text("Année Acad. :", 260, 92);
    doc.font("Helvetica").text(annee?.libelle || "-", 340, 92);

    doc.font("Helvetica-Bold").text("Tranche :", 260, 107);
    doc.font("Helvetica").text(p.comentaire || "-", 340, 107);

    doc.font("Helvetica-Bold").text("Mode Paiement :", 260, 122);
    doc.font("Helvetica").text(mode?.libelle || "-", 340, 122);

    doc.font("Helvetica-Bold").text("Réf. Opération :", 260, 137);
    doc.font("Helvetica").text(p.operation_ID || "-", 340, 137);

    // Amount box
    doc.rect(30, 160, doc.page.width - 60, 28).fill("#1b4332");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text(`MONTANT VERSÉ : ${Number(p.montant).toLocaleString("fr-FR")} FCFA`, 40, 169);

    // Signatures
    doc.fillColor("#666666").fontSize(7.5).font("Helvetica-Oblique").text("Le Service de Comptabilité GEP", 30, 240, { align: "right" });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur lors de la génération du reçu" });
  }
});


router.post("/", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    const { matricule, idAca, montant, idMode, datePaie, idTranche } = req.body;
    if (!matricule || !idAca || !montant || !idMode || !datePaie || !idTranche) {
      res.status(400).json({ error: "Champs requis: matricule, idAca, montant, idMode, datePaie, idTranche" }); return;
    }
    const [tranche] = await db.select().from(tranchesTable).where(eq(tranchesTable.idTranche, Number(idTranche))).limit(1);
    if (!tranche) { res.status(404).json({ error: "Tranche introuvable" }); return; }
    const dejaPayes = await db
      .select()
      .from(paiementTable)
      .where(and(eq(paiementTable.matricule, Number(matricule)), eq(paiementTable.idTranche, Number(idTranche))));
    const dejaPaye = dejaPayes.reduce((s, p) => s + Number(p.montant), 0);
    const restant = Math.round((tranche.montant - dejaPaye) * 100) / 100;
    if (Number(montant) > restant) {
      res.status(400).json({ error: `Montant supérieur au solde restant de la tranche (${restant} FCFA)` }); return;
    }
    await db.insert(paiementTable).values({
      matricule, idAca, montant, idMode, datePaie,
      idTranche: Number(idTranche),
      url: req.body.url ?? "",
      comentaire: req.body.comentaire ?? tranche.libelle,
      operation_ID: req.body.operation_ID ?? "",
      idPers: req.user!.id,
      dateEnregistrer: new Date(),
    });
    res.status(201).json({ message: "Paiement enregistré" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.update(paiementTable).set(req.body).where(eq(paiementTable.idPaie, Number(req.params.id)));
    const [p] = await paiementsWithRelations(eq(paiementTable.idPaie, Number(req.params.id)));
    if (!p) { res.status(404).json({ error: "Paiement introuvable" }); return; }
    res.json(p);
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.COMPTABLE), async (req, res) => {
  try {
    await db.delete(paiementTable).where(eq(paiementTable.idPaie, Number(req.params.id)));
    res.json({ message: "Paiement supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
