import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, personneTable, parentsTable } from "@workspace/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { authenticate } from "../middlewares/auth.ts";
import { authorize, ROLES, getRole } from "../middlewares/rbac.ts";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT, ROLES.SECRETAIRE));

router.get("/", async (req, res) => {
  try {
    const role = getRole(req.user);
    const rows = await db
      .select({ message: messagesTable, expediteur: personneTable, parent: parentsTable })
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
      .select({ message: messagesTable, expediteur: personneTable, parent: parentsTable })
      .from(messagesTable)
      .leftJoin(personneTable, eq(messagesTable.idExp_Pers, personneTable.idPers))
      .leftJoin(parentsTable, eq(messagesTable.idParent, parentsTable.idParent))
      .where(eq(messagesTable.idMessages, Number(req.params.id)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Message introuvable" }); return; }
    res.json({ ...rows[0].message, expediteur: rows[0].expediteur, parent: rows[0].parent });
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
