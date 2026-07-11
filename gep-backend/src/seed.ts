import { db, pool } from "@workspace/db";
import {
  adminTable, personneTable, villeNaissanceTable, quartierTable,
  cycleTable, classeTable, salleTable, anneeAcademiqueTable,
  trimestreTable, coursTable, modeTable, scolariteTable, disciplineTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Démarrage du seeding sur ecole2026@127.0.0.1:3307...\n");

  const hash = (pw: string) => bcrypt.hash(pw, 12);
  const now = new Date();

  console.log("👤 Création des comptes Admin...");
  const adminList = [
    { login: "directeur", password: await hash("Password@2026"), typeAdmin: 1 as const, actif: 1 as const },
    { login: "secretaire", password: await hash("Password@2026"), typeAdmin: 2 as const, actif: 1 as const },
    { login: "comptable", password: await hash("Password@2026"), typeAdmin: 3 as const, actif: 1 as const },
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
    { login: "mbeng", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Mbeng", prenom: "Patricia", mobile: "+237699100001", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "nkomo", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Nkomo", prenom: "Jean", mobile: "+237699100002", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "atangana", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Atangana", prenom: "Marie", mobile: "+237699100003", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "fotso", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Fotso", prenom: "Paul", mobile: "+237699100004", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "tchinda", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Tchinda", prenom: "Cecile", mobile: "+237699100005", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "manga", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Manga", prenom: "David", mobile: "+237699100006", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "njonga", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Njonga", prenom: "Sandrine", mobile: "+237699100007", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "essomba", password: await hash("Password@2026"), typePersonne: 1 as const, nom: "Essomba", prenom: "Pierre", mobile: "+237699100008", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "ekotto", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Ekotto", prenom: "Andre", mobile: "+237677200001", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "mbida", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Mbida", prenom: "Therese", mobile: "+237677200002", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "cameroon", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Cameroon", prenom: "Joseph", mobile: "+237677200003", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "nguetsop", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Nguetsop", prenom: "Marthe", mobile: "+237677200004", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "tchoupa", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Tchoupa", prenom: "Isaac", mobile: "+237677200005", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "bikoi", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Bikoi", prenom: "Sylvie", mobile: "+237677200006", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "mbarga2", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Mbarga", prenom: "Emmanuel", mobile: "+237677200007", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "tadadjeu", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Tadadjeu", prenom: "Brigitte", mobile: "+237677200008", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "nkoula", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Nkoula", prenom: "Georges", mobile: "+237677200009", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "fokou", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Fokou", prenom: "Aimee", mobile: "+237677200010", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "sone", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Sone", prenom: "Marc", mobile: "+237677200011", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "effa", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Effa", prenom: "Valerie", mobile: "+237677200012", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "tchango", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Tchango", prenom: "Robert", mobile: "+237677200013", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "ngono", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Ngono", prenom: "Helene", mobile: "+237677200014", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "tchatchoua", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Tchatchoua", prenom: "Daniel", mobile: "+237677200015", actif: 1 as const, idAdmin: adminId, created_at: now },
    { login: "zafack", password: await hash("Password@2026"), typePersonne: 2 as const, nom: "Zafack", prenom: "Diane", mobile: "+237677200016", actif: 1 as const, idAdmin: adminId, created_at: now },
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
  for (const libelle of ["Yaoundé", "Douala", "Bamenda", "Bafoussam", "Garoua", "Maroua", "Bertoua", "Ebolowa", "Kribi", "Limbe"]) {
    try {
      const [ex] = await db.select().from(villeNaissanceTable).where(eq(villeNaissanceTable.libelle, libelle)).limit(1);
      if (!ex) await db.insert(villeNaissanceTable).values({ libelle, actif: 1 });
    } catch (_) {}
  }

  for (const q of [{ libelle: "Bastos", description: "Quartier résidentiel de Yaoundé" }, { libelle: "Mvog-Mbi", description: "Quartier populaire du centre" }, { libelle: "Biyem-Assi", description: "Quartier universitaire" }, { libelle: "Essos", description: "Quartier résidentiel calme" }]) {
    try {
      const [ex] = await db.select().from(quartierTable).where(eq(quartierTable.libelle, q.libelle)).limit(1);
      if (!ex) await db.insert(quartierTable).values(q);
    } catch (_) {}
  }

  console.log("📚 Filières (Cycle) et Classes...");
  const cycleData = [
    { libelle: "Anglophone", description: "Section anglophone", idAdmin: adminId, created: now },
    { libelle: "Francophone", description: "Section francophone", idAdmin: adminId, created: now },
    { libelle: "Bilingue", description: "Section bilingue", idAdmin: adminId, created: now },
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
    { libelle: "Class 1 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 1 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 2 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 2 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 3 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 3 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 4 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 4 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 5 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 5 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 6 A", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "Class 6 B", idCycle: anglophoneId, idAdmin: adminId, created_at: now },
    { libelle: "SIL A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "SIL B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CP A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CP B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CE1 A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CE1 B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CE2 A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CE2 B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CM1 A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CM1 B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CM2 A", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "CM2 B", idCycle: francophoneId, idAdmin: adminId, created_at: now },
    { libelle: "SIL A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "SIL B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 1 A Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 1 B Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 2 A Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 2 B Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 3 A Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 3 B Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 4 A Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 4 B Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 5 A Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "Class 5 B Bilingual", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CP A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CP B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CE1 A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CE1 B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CE2 A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CE2 B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CM1 A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CM1 B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CM2 A Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
    { libelle: "CM2 B Bilingue", idCycle: bilingueId, idAdmin: adminId, created_at: now },
  ];
  for (const c of classeData) {
    try {
      const [ex] = await db.select().from(classeTable).where(eq(classeTable.libelle, c.libelle)).limit(1);
      if (!ex) await db.insert(classeTable).values(c);
    } catch (_) {}
  }

  const classes = await db.select().from(classeTable);
  const classeId = classes[0]?.idClasse ?? 1;

  console.log("🏫 Salles...");
  for (const cls of classes) {
    try {
      const libelle = `Salle ${cls.libelle.replace(/\s/g, "-")}`;
      const [ex] = await db.select().from(salleTable).where(eq(salleTable.libelle, libelle)).limit(1);
      if (!ex) await db.insert(salleTable).values({ libelle, position: `Bâtiment ${cls.libelle}`, surface: "50m²", idClasse: cls.idClasse, actif: 1 as const, idAdmin: adminId, created_at: now });
    } catch (_) {}
  }

  console.log("📅 Années académiques et Trimestres...");
  const currentYear = now.getFullYear();
  const academicYears = [
    { libelle: `${currentYear - 2}-${currentYear - 1}`, periode: `Septembre ${currentYear - 2} – Juin ${currentYear - 1}`, created_at: `${currentYear - 2}-09-01`, idAdmin: adminId },
    { libelle: `${currentYear - 1}-${currentYear}`, periode: `Septembre ${currentYear - 1} – Juin ${currentYear}`, created_at: `${currentYear - 1}-09-01`, idAdmin: adminId },
    { libelle: `${currentYear}-${currentYear + 1}`, periode: `Septembre ${currentYear} – Juin ${currentYear + 1}`, created_at: `${currentYear}-09-01`, idAdmin: adminId },
  ];
  for (const a of academicYears) {
    try {
      const [ex] = await db.select().from(anneeAcademiqueTable).where(eq(anneeAcademiqueTable.libelle, a.libelle)).limit(1);
      if (!ex) await db.insert(anneeAcademiqueTable).values(a);
    } catch (_) {}
  }

  const annees = await db.select().from(anneeAcademiqueTable);
  const currentAnnee = annees.find(a => a.libelle === `${currentYear}-${currentYear + 1}`);
  const anneeId = currentAnnee?.idAnnee ?? annees[0]?.idAnnee ?? 1;

  const trimestreData = [
    { libelle: "1er Trimestre", periode: `Sept – Déc ${currentYear}`, idAca: anneeId, idAdmin: adminId },
    { libelle: "2ème Trimestre", periode: `Jan – Mars ${currentYear + 1}`, idAca: anneeId, idAdmin: adminId },
    { libelle: "3ème Trimestre", periode: `Avr – Juin ${currentYear + 1}`, idAca: anneeId, idAdmin: adminId },
  ];
  for (const t of trimestreData) {
    try {
      const [ex] = await db.select().from(trimestreTable).where(eq(trimestreTable.libelle, t.libelle)).limit(1);
      if (!ex) await db.insert(trimestreTable).values(t);
    } catch (_) {}
  }

  console.log("📖 Cours (5 par classe)...");
  const coursLabels = [
    { libelle: "Mathématiques", coefficient: 3, description: "Mathématiques" },
    { libelle: "Français", coefficient: 3, description: "Langue française" },
    { libelle: "Anglais", coefficient: 3, description: "Langue anglaise" },
    { libelle: "Sciences Naturelles", coefficient: 2, description: "Sciences naturelles" },
    { libelle: "Histoire-Géographie", coefficient: 1, description: "Histoire et géographie" },
  ];
  for (const cls of classes) {
    for (const co of coursLabels) {
      try {
        const [ex] = await db.select().from(coursTable).where(eq(coursTable.libelle, co.libelle)).limit(1);
        if (!ex) await db.insert(coursTable).values({ ...co, idClasse: cls.idClasse, actif: 1 as const, idAdmin: adminId, created_at: now });
      } catch (_) {}
    }
  }

  console.log("💰 Modes de paiement et Scolarité...");
  const modeData = [
    { libelle: "Espèces", information: "Paiement en espèces à la caisse", actif: 1 as const, idFondateur: adminId, created_at: now },
    { libelle: "Virement bancaire", information: "Virement vers le compte de l'école", actif: 1 as const, idFondateur: adminId, created_at: now },
    { libelle: "Mobile Money", information: "MTN MoMo / Orange Money", actif: 1 as const, idFondateur: adminId, created_at: now },
  ];
  for (const m of modeData) {
    try {
      const [ex] = await db.select().from(modeTable).where(eq(modeTable.libelle, m.libelle)).limit(1);
      if (!ex) await db.insert(modeTable).values(m);
    } catch (_) {}
  }

  const cycleRows = await db.select().from(cycleTable);
  const scolariteData = cycleRows.map((cyc, i) => ({
    inscription: 20000 + i * 5000,
    pension: 45000 + i * 5000,
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
  console.log("║                            pass:  Password@2026         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  SECRÉTAIRE (typeAdmin=2)  login: secretaire            ║");
  console.log("║                            pass:  Password@2026         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  COMPTABLE  (typeAdmin=3)  login: comptable             ║");
  console.log("║                            pass:  Password@2026         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  ENSEIGNANT (typePersonne=1) login: mbeng / nkomo / ... ║");
  console.log("║                              pass:  Password@2026       ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  PARENT    (typePersonne=2) login: ekotto / mbida / ... ║");
  console.log("║                             pass:  Password@2026        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}

seed()
  .catch((err) => { console.error("❌ Erreur de seeding:", err); process.exit(1); })
  .finally(async () => { await (pool as any).end(); process.exit(0); });
