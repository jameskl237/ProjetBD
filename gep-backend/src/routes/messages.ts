import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, personneTable, parentsTable } from "@workspace/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";

const expediteurAlias = aliasedTable(personneTable, "expediteur");
const destinataireAlias = aliasedTable(personneTable, "destinataire");

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE));

router.get("/", async (req, res) => {
  try {
    const role = getRole(req.user);
    const rows = await db
      .select({ message: messagesTable, expediteur: expediteurAlias, parent: parentsTable, destinataire: destinataireAlias })
      .from(messagesTable)
      .leftJoin(personneTable, eq(messagesTable.idExp_Pers, personneTable.idPers))
      .leftJoin(parentsTable, eq(messagesTable.idParent, parentsTable.idParent));
    const msgs = rows.map(({ message, expediteur, parent }) => ({ ...message, expediteur, parent }));

    // Les admins/sec voient tout. Les enseignants/parents ne voient que les annonces qui leur sont destinées.
    if (role === ROLES.ADMINISTRATEUR || role === ROLES.SECRETAIRE || role === ROLES.COMPTABLE) {
      res.json(msgs);
    } else if (role === ROLES.ENSEIGNANT) {
      res.json(msgs.filter((m) => m.receiverRole === 'enseignants' || m.receiverRole === 'tous'));
    } else if (role === ROLES.PARENT) {
      res.json(msgs.filter((m) => m.receiverRole === 'parents' || m.receiverRole === 'tous'));
    } else {
      res.json(msgs);
    }
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const rows = await db
      .select({ message: messagesTable, expediteur: expediteurAlias, parent: parentsTable, destinataire: destinataireAlias })
      .from(messagesTable)
      .leftJoin(expediteurAlias, eq(messagesTable.idExp_Pers, expediteurAlias.idPers))
      .leftJoin(parentsTable, eq(messagesTable.idParent, parentsTable.idParent))
      .leftJoin(destinataireAlias, eq(messagesTable.recipientPersId, destinataireAlias.idPers))
      .where(eq(messagesTable.idMessages, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Message introuvable" }); return; }
    res.json({ ...rows[0].message, expediteur: rows[0].expediteur, parent: rows[0].parent, destinataire: rows[0].destinataire });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.SECRETAIRE), async (req, res) => {
  try {
    const { idParent, objet, information, type_message, AnneeAcade, senderRole, senderId, senderLabel, receiverRole, receiverId, receiverLabel, subject, content, cible } = req.body;
    if (!objet || !information) { res.status(400).json({ error: "L'objet et le message sont obligatoires" }); return; }
    const now = new Date();
    const cibleValue = cible || 'parents';
    await db.insert(messagesTable).values({
      idExp_Pers: req.user!.id,
      idParent: idParent || 0,
      objet: objet ?? "",
      subject: subject ?? objet ?? "",
      information: information ?? "",
      content: content ?? information ?? null,
      type_message: cibleValue === 'enseignants' ? 2 : cibleValue === 'tous' ? 3 : (type_message ?? 1),
      AnneeAcade: AnneeAcade ?? "",
      senderRole: senderRole ?? req.user!.type,
      senderId: senderId ?? String(req.user!.id),
      senderLabel: senderLabel ?? null,
      receiverRole: receiverRole ?? cibleValue,
      receiverId: receiverId ?? null,
      receiverLabel: receiverLabel ?? null,
      valider: 0,
      isRead: 0,
      created_at: now,
      updated_at: now,
    });
    res.status(201).json({ message: "Annonce envoyée avec succès" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

async function getMatriculesForClasse(idClasse: number): Promise<number[]> {
  const [latestAnnee] = await db
    .select()
    .from(anneeAcademiqueTable)
    .where(eq(anneeAcademiqueTable.isDelete, 0))
    .orderBy(desc(anneeAcademiqueTable.idAnnee))
    .limit(1);
  if (!latestAnnee) return [];
  const salles = await db.select({ idSalle: salleTable.idSalle }).from(salleTable).where(eq(salleTable.idClasse, idClasse));
  const salleIds = salles.map((s) => s.idSalle);
  if (salleIds.length === 0) return [];
  const freqRows = await db
    .select({ matricule: frequenteTable.matricule })
    .from(frequenteTable)
    .where(and(inArray(frequenteTable.idSalle, salleIds), eq(frequenteTable.idAcademi, latestAnnee.idAnnee)));
  return [...new Set(freqRows.map((r) => r.matricule))];
}

async function getParentIds(matricules: number[]): Promise<{ idParent: number; idPers: number }[]> {
  if (matricules.length === 0) return [];
  const rows = await db
    .select({ idParent: parentsTable.idParent, idPers: parentsTable.idPers })
    .from(parentsTable)
    .where(and(inArray(parentsTable.matricule, matricules), eq(parentsTable.isDelete, 0)));
  return rows;
}

async function getEnseignantPersIdsForClasse(idClasse: number): Promise<number[]> {
  const rows = await db
    .select({ idPers: enseignantTable.idPers })
    .from(enseignantTable)
    .innerJoin(coursTable, eq(enseignantTable.idCours, coursTable.idCours))
    .where(and(eq(coursTable.idClasse, idClasse), eq(enseignantTable.isDelete, 0)));
  return [...new Set(rows.map((r) => r.idPers))];
}

async function getAllEnseignantPersIds(): Promise<number[]> {
  const rows = await db
    .select({ idPers: enseignantTable.idPers })
    .from(enseignantTable)
    .where(eq(enseignantTable.isDelete, 0));
  return [...new Set(rows.map((r) => r.idPers))];
}

router.post("/broadcast", authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT), async (req, res) => {
  try {
    const { target, idClasse, ids, objet, information } = req.body;
    if (!objet?.trim()) { res.status(400).json({ error: "Objet requis" }); return; }
    if (!information?.trim()) { res.status(400).json({ error: "Message requis" }); return; }

    const parentEntries: { idParent: number; idPers: number }[] = [];
    const enseignantPersIds: number[] = [];

    if (target === "parents") {
      if (idClasse) {
        const matricules = await getMatriculesForClasse(Number(idClasse));
        const rows = await getParentIds(matricules);
        parentEntries.push(...rows);
      } else if (Array.isArray(ids) && ids.length > 0) {
        const rows = await db
          .select({ idParent: parentsTable.idParent, idPers: parentsTable.idPers })
          .from(parentsTable)
          .where(and(inArray(parentsTable.idParent, ids.map(Number)), eq(parentsTable.isDelete, 0)));
        parentEntries.push(...rows);
      } else {
        const rows = await db
          .select({ idParent: parentsTable.idParent, idPers: parentsTable.idPers })
          .from(parentsTable)
          .where(eq(parentsTable.isDelete, 0));
        parentEntries.push(...rows);
      }
    } else if (target === "enseignants") {
      if (idClasse) {
        const pids = await getEnseignantPersIdsForClasse(Number(idClasse));
        enseignantPersIds.push(...pids);
      } else if (Array.isArray(ids) && ids.length > 0) {
        enseignantPersIds.push(...ids.map(Number));
      } else {
        const pids = await getAllEnseignantPersIds();
        enseignantPersIds.push(...pids);
      }
    } else if (target === "all") {
      const allParents = await db
        .select({ idParent: parentsTable.idParent, idPers: parentsTable.idPers })
        .from(parentsTable)
        .where(eq(parentsTable.isDelete, 0));
      parentEntries.push(...allParents);
      const allEns = await getAllEnseignantPersIds();
      enseignantPersIds.push(...allEns);
    } else {
      res.status(400).json({ error: "target invalide (parents | enseignants | all)" }); return;
    }

    const totalParents = parentEntries.length;
    const totalEns = enseignantPersIds.length;
    const total = totalParents + totalEns;
    if (total === 0) {
      res.status(400).json({ error: "Aucun destinataire trouvé pour les critères sélectionnés" }); return;
    }

    const now = new Date();
    const senderRole = req.user!.type;
    const senderId = String(req.user!.id);
    const senderLabel = req.user!.nom ?? null;

    const parentMessages = parentEntries.map(({ idParent, idPers }) => ({
      idExp_Pers: req.user!.id,
      idParent,
      recipientPersId: idPers,
      objet: objet.trim(),
      subject: objet.trim(),
      information: information.trim(),
      content: information.trim(),
      type_message: 1 as const,
      AnneeAcade: "",
      senderRole,
      senderId,
      senderLabel,
      receiverRole: "parent" as const,
      receiverId: String(idPers),
      receiverLabel: null,
      valider: 0 as const,
      isRead: 0 as const,
      created_at: now,
      updated_at: now,
    }));

    const ensMessages = enseignantPersIds.map((idPers) => ({
      idExp_Pers: req.user!.id,
      idParent: null as unknown as number,
      recipientPersId: idPers,
      objet: objet.trim(),
      subject: objet.trim(),
      information: information.trim(),
      content: information.trim(),
      type_message: 1 as const,
      AnneeAcade: "",
      senderRole,
      senderId,
      senderLabel,
      receiverRole: "enseignant" as const,
      receiverId: String(idPers),
      receiverLabel: null,
      valider: 0 as const,
      isRead: 0 as const,
      created_at: now,
      updated_at: now,
    }));

    const allMessages = [...parentMessages, ...ensMessages];
    await db.insert(messagesTable).values(allMessages);
    res.status(201).json({ message: `${total} message(s) envoyé(s)` });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/lire", async (req, res) => {
  try {
    await db.update(messagesTable).set({ isRead: 1, readAt: new Date(), updated_at: new Date() }).where(eq(messagesTable.idMessages, Number(req.params.id)));
    res.json({ message: "Message marqué comme lu" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/:id/valider", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.update(messagesTable).set({ valider: 1, updated_at: new Date() }).where(eq(messagesTable.idMessages, Number(req.params.id)));
    res.json({ message: "Message validé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/:id", authorize(ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE), async (req, res) => {
  try {
    await db.delete(messagesTable).where(eq(messagesTable.idMessages, Number(req.params.id)));
    res.json({ message: "Message supprimé" });
  } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
