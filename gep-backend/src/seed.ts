import { db, pool } from "@workspace/db";
import {
  adminTable, personneTable, villeNaissanceTable, quartierTable,
  cycleTable, classeTable, salleTable, anneeAcademiqueTable,
  trimestreTable, coursTable, modeTable, scolariteTable, disciplineTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Démarrage du seeding sur ecole2026@163.123.183.89:17705...\n");

  const hash = (pw: string) => bcrypt.hash(pw, 12);
  const now = new Date();

  console.log("👤 Création des comptes Admin...");
  const adminList = [
    { login: "directeur", password: await hash("Directeur@2024"), typeAdmin: 1 as const, actif: 1 as const },
    { login: "secretaire", password: await hash("Secretaire@2024"), typeAdmin: 2 as const, actif: 1 as const },
    { login: "comptable", password: await hash("Comptable@2024"), typeAdmin: 3 as const, actif: 1 as const },
  ];

  for (const val of adminList) {
    try {
      const [existing] = await db.select().from(adminTable).where(eq(adminTable.login, val.login)).limit(1);
      if (!existing) {
        await db.insert(adminTable).values({ ...val, createdAt: now, updatedAt: now });
      }
    } catch (e: any) { console.warn(`  ⚠️  Admin ${val.login}: ${e.message}`); }
  }

  const adminRows = await db.select().from(adminTable).limit(1);
  const adminId = adminRows[0]?.ID ?? 1;

  console.log("👥 Création des Personnes...");
  const personneList = [
    { login: "enseignant", password: await hash("Enseignant@2024"), typePersonne: 1 as const, nom: "Amrani", prenom: "Hassan", mobile: "+213555000010", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "parent", password: await hash("Parent@2024"), typePersonne: 2 as const, nom: "Khelil", prenom: "Mohamed", mobile: "+213555000020", actif: 1 as const, idAdmin: adminId, created_at: now },
  ];

  for (const val of personneList) {
    try {
      const [existing] = await db.select().from(personneTable).where(eq(personneTable.login, val.login)).limit(1);
      if (!existing) {
        await db.insert(personneTable).values({ ...val, createdAt: now, updatedAt: now });
      }
    } catch (e: any) { console.warn(`  ⚠️  Personne ${val.login}: ${e.message}`); }
  }

  console.log("🏘️  Villes et Quartiers...");
  for (const libelle of ["Alger", "Oran", "Constantine"]) {
    try {
      const [ex] = await db.select().from(villeNaissanceTable).where(eq(villeNaissanceTable.libelle, libelle)).limit(1);
      if (!ex) await db.insert(villeNaissanceTable).values({ libelle, actif: 1 });
    } catch (_) {}
  }

  for (const q of [{ libelle: "Bab Ezzouar", description: "Zone universitaire est d'Alger" }, { libelle: "Hydra", description: "Quartier résidentiel d'Alger" }]) {
    try {
      const [ex] = await db.select().from(quartierTable).where(eq(quartierTable.libelle, q.libelle)).limit(1);
      if (!ex) await db.insert(quartierTable).values(q);
    } catch (_) {}
  }

  console.log("📚 Filières (Cycle) et Classes...");
  // "Cycle" porte la filière linguistique de la classe (Anglophone/Francophone/Bilingue).
  const cycleData = [
    { libelle: "Anglophone", description: "Filière anglophone", idAdmin: adminId, created: now },
    { libelle: "Francophone", description: "Filière francophone", idAdmin: adminId, created: now },
    { libelle: "Bilingue", description: "Filière bilingue", idAdmin: adminId, created: now },
  ];
  for (const c of cycleData) {
    try {
      const [ex] = await db.select().from(cycleTable).where(eq(cycleTable.libelle, c.libelle)).limit(1);
      if (!ex) await db.insert(cycleTable).values(c);
    } catch (_) {}
  }

  const cycles = await db.select().from(cycleTable).limit(3);
  const anglophoneId = cycles[0]?.idCycle ?? 1;
  const francophoneId = cycles[1]?.idCycle ?? 2;
  const bilingueId = cycles[2]?.idCycle ?? 3;

  const classeData = [
    { libelle: "1ère Année A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "2ème Année B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "6ème Moyen A", idCycle: bilingueId, idAdmin: adminId, created_at: now },
  ];
  for (const c of classeData) {
    try {
      const [ex] = await db.select().from(classeTable).where(eq(classeTable.libelle, c.libelle)).limit(1);
      if (!ex) await db.insert(classeTable).values(c);
    } catch (_) {}
  }

  const classes = await db.select().from(classeTable).limit(3);
  const classeId = classes[0]?.idClasse ?? 1;

  console.log("🏫 Salles...");
  const salleData = [
    { libelle: "Salle 101", position: "Bâtiment A - RDC", surface: "50m²", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
    { libelle: "Salle 202", position: "Bâtiment B - 1er étage", surface: "60m²", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
  ];
  for (const s of salleData) {
    try {
      const [ex] = await db.select().from(salleTable).where(eq(salleTable.libelle, s.libelle)).limit(1);
      if (!ex) await db.insert(salleTable).values(s);
    } catch (_) {}
  }

  console.log("📅 Années académiques et Trimestres...");
  try {
    const [ex] = await db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.libelle, "2024-2025")).limit(1);
    if (!ex) {
      await db.insert(anneeAcademiqueTable).values({ libelle: "2024-2025", periode: "Septembre 2024 – Juin 2025", created_at: "2024-09-01", idAdmin: adminId });
    }
  } catch (_) {}

  const annees = await db.select().from(anneeAcademiqueTable).limit(1);
  const anneeId = annees[0]?.idAnnee ?? 1;

  const trimestreData = [
    { libelle: "1er Trimestre", periode: "Sept – Déc 2024", idAca: anneeId, idAdmin: adminId },
    { libelle: "2ème Trimestre", periode: "Jan – Mars 2025", idAca: anneeId, idAdmin: adminId },
    { libelle: "3ème Trimestre", periode: "Avr – Juin 2025", idAca: anneeId, idAdmin: adminId },
  ];
  for (const t of trimestreData) {
    try {
      const [ex] = await db.select().from(trimestreTable).where(eq(trimestreTable.libelle, t.libelle)).limit(1);
      if (!ex) await db.insert(trimestreTable).values(t);
    } catch (_) {}
  }

  console.log("📖 Cours...");
  const coursData = [
    { libelle: "Mathématiques", coefficient: 3, description: "Mathématiques", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
    { libelle: "Français", coefficient: 2, description: "Langue française", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
    { libelle: "Arabe", coefficient: 3, description: "Langue arabe", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
    { libelle: "Sciences Naturelles", coefficient: 2, description: "Sciences naturelles", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
    { libelle: "Histoire-Géographie", coefficient: 1, description: "Histoire et géographie", idClasse: classeId, actif: 1 as const, idAdmin: adminId, created_at: now },
  ];
  for (const c of coursData) {
    try {
      const [ex] = await db.select().from(coursTable).where(eq(coursTable.libelle, c.libelle)).limit(1);
      if (!ex) await db.insert(coursTable).values(c);
    } catch (_) {}
  }

  console.log("💰 Modes de paiement et Scolarité...");
  const modeData = [
    { libelle: "Espèces", information: "Paiement en cash à la caisse", actif: 1 as const, idFondateur: adminId, created_at: now },
    { libelle: "Virement bancaire", information: "Virement vers compte école", actif: 1 as const, idFondateur: adminId, created_at: now },
    { libelle: "Chèque", information: "Chèque à l'ordre de l'établissement", actif: 1 as const, idFondateur: adminId, created_at: now },
  ];
  for (const m of modeData) {
    try {
      const [ex] = await db.select().from(modeTable).where(eq(modeTable.libelle, m.libelle)).limit(1);
      if (!ex) await db.insert(modeTable).values(m);
    } catch (_) {}
  }

  // Pension fixée par cycle — réservé au directeur.
  const cycleRows = await db.select().from(cycleTable);
  const scolariteData = cycleRows.map((cyc, i) => ({
    inscription: 5000 + i * 1000,
    pension: 30000 + i * 6000,
    nbreTranche: 3,
    description: `Scolarité ${cyc.libelle}`,
    idCycle: cyc.idCycle,
    idFondateur: adminId,
    created_at: now,
  }));
  for (const s of scolariteData) {
    try {
      const [ex] = await db.select().from(scolariteTable).where(eq(scolariteTable.idCycle, s.idCycle)).limit(1);
      if (!ex) await db.insert(scolariteTable).values(s);
    } catch (_) {}
  }

  console.log("⚖️  Types de discipline...");
  const disciplineData = [
    { libelle: "Avertissement", points: 1 },
    { libelle: "Blâme", points: 3 },
    { libelle: "Exclusion temporaire", points: 5 },
    { libelle: "Félicitation", points: 2 },
    { libelle: "Tableau d'honneur", points: 5 },
  ];
  for (const d of disciplineData) {
    try {
      const [ex] = await db.select().from(disciplineTable).where(eq(disciplineTable.libelle, d.libelle)).limit(1);
      if (!ex) await db.insert(disciplineTable).values(d);
    } catch (_) {}
  }

  console.log("\n✅ Seeding terminé avec succès !\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║              COMPTES DE DÉMONSTRATION                   ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  DIRECTEUR  (typeAdmin=1)  login: directeur             ║");
  console.log("║                            pass:  Directeur@2024        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  SECRÉTAIRE (typeAdmin=2)  login: secretaire            ║");
  console.log("║                            pass:  Secretaire@2024       ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  COMPTABLE  (typeAdmin=3)  login: comptable             ║");
  console.log("║                            pass:  Comptable@2024        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  ENSEIGNANT (typePersonne=1) login: enseignant          ║");
  console.log("║                              pass:  Enseignant@2024     ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  PARENT    (typePersonne=2) login: parent               ║");
  console.log("║                             pass:  Parent@2024          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

seed()
  .catch((err) => { console.error("❌ Erreur de seeding:", err); process.exit(1); })
  .finally(async () => { await (pool as any).end(); process.exit(0); });
