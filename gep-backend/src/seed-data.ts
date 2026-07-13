import { pool } from "@workspace/db";

async function seedData() {
  const conn = await pool.getConnection();
  console.log("🚀 Enrichissement de la base de données...\n");
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
  const today = now.toISOString().split("T")[0];

  const q = async (sql: string) => { const [r] = await conn.query(sql); return r; };
  const q1 = async (sql: string) => { const [r]: any = await conn.query(sql); return r?.cnt ?? 0; };

  // Reference IDs
  const adminId = (await q1("SELECT ID as cnt FROM Admin LIMIT 1")) || 1;
  const persRows: any[] = await q("SELECT idPers, typePersonne, prenom, nom FROM Personne");
  const enseignants = persRows.filter((p: any) => p.typePersonne === 1);
  const parentPers = persRows.filter((p: any) => p.typePersonne === 2);
  const villes: any[] = await q("SELECT idVille, libelle FROM VilleNaissance");
  const salles: any[] = await q("SELECT idSalle, idClasse FROM Salle");
  const classes: any[] = await q("SELECT idClasse, libelle FROM Classe");
  const annees: any[] = await q("SELECT idAnnee, libelle FROM AnneeAcademique");
  const trimestres: any[] = await q("SELECT idTrimes, idAca FROM Trimestre");
  const coursList: any[] = await q("SELECT idCours, libelle, idClasse FROM Cours");
  const modes: any[] = await q("SELECT idMode FROM Mode");
  const scolarites: any[] = await q("SELECT idScolarite, idCycle, pension, nbreTranche FROM Scolarite");

  const currentAnnee = annees.find(a => a.libelle === "2025-2026") || annees[0];
  const anneeId = currentAnnee.idAnnee;
  const trimestreIds = trimestres.filter(t => t.idAca === anneeId).map(t => t.idTrimes);
  if (trimestreIds.length === 0) trimestres.forEach(t => trimestreIds.push(t.idTrimes));

  // --- Élèves ---
  console.log("🎓 Création des élèves...");
  const existingEleves: any[] = await q("SELECT COUNT(*) as cnt FROM Eleve");
  if (existingEleves[0]?.cnt === 0) {
    const eleves = [
      ["Fotso","Ali","2012-03-15","Yaoundé",1,"Français","Yaoundé"],
      ["Nkomo","Sarah","2011-07-22","Douala",0,"Français","Douala"],
      ["Atangana","Paul","2013-01-10","Yaoundé",1,"Anglais","Yaoundé"],
      ["Mbarga","Julie","2010-11-05","Bamenda",0,"Anglais","Bamenda"],
      ["Tchinda","David","2012-06-18","Bafoussam",1,"Bilingue","Bafoussam"],
      ["Ngono","Marie","2011-09-30","Yaoundé",0,"Français","Yaoundé"],
      ["Essomba","Jean","2013-04-12","Douala",1,"Français","Douala"],
      ["Ekotto","Carine","2010-08-25","Yaoundé",0,"Bilingue","Yaoundé"],
      ["Tadadjeu","Samuel","2012-12-03","Garoua",1,"Français","Garoua"],
      ["Zafack","Diane","2011-02-14","Yaoundé",0,"Anglais","Yaoundé"],
      ["Njonga","Patrick","2013-05-20","Bertoua",1,"Français","Bertoua"],
      ["Bikoi","Esther","2010-10-08","Douala",0,"Français","Douala"],
      ["Manga","Cedric","2012-07-01","Ebolowa",1,"Bilingue","Ebolowa"],
      ["Fokou","Sandrine","2011-04-16","Yaoundé",0,"Anglais","Yaoundé"],
      ["Tchatchoua","Emmanuel","2013-09-28","Kribi",1,"Français","Kribi"],
      ["Nguetsop","Aimée","2010-12-21","Maroua",0,"Français","Maroua"],
      ["Mbida","Thierry","2012-08-09","Limbe",1,"Anglais","Limbe"],
      ["Sone","Veronique","2011-06-11","Yaoundé",0,"Français","Yaoundé"],
      ["Cameroon","Fabrice","2013-03-07","Bamenda",1,"Anglais","Bamenda"],
      ["Effa","Nadège","2010-05-19","Yaoundé",0,"Bilingue","Yaoundé"],
      ["Tchoupa","Olivier","2012-01-26","Douala",1,"Français","Douala"],
      ["Nkoula","Chantal","2011-11-13","Bafoussam",0,"Français","Bafoussam"],
      ["Tchango","Bertrand","2013-07-17","Yaoundé",1,"Bilingue","Yaoundé"],
      ["Mbeng","Ange","2010-09-02","Garoua",0,"Français","Garoua"],
      ["Ngoumou","Hervé","2012-04-30","Douala",1,"Français","Douala"],
      ["Abomo","Lydie","2011-08-15","Yaoundé",0,"Bilingue","Yaoundé"],
      ["Meyo","Gilles","2013-02-09","Kribi",1,"Anglais","Kribi"],
      ["Tabi","Raissa","2010-06-24","Bamenda",0,"Anglais","Bamenda"],
      ["Bassa","Yvan","2012-10-11","Yaoundé",1,"Français","Yaoundé"],
      ["Tsafack","Michèle","2011-03-03","Ebolowa",0,"Français","Ebolowa"],
    ];
    for (const e of eleves) {
      const ville = villes.find((v: any) => v.libelle === e[6]) || villes[0];
      try {
        await q(`INSERT INTO Eleve (nom,prenom,dateNaissance,lieuNaissance,sexe,langue,actif,idVilleNaissance,idAdmin,created_at,isDelete)
          VALUES ('${e[0]}','${e[1]}','${e[2]}','${e[3]}',${e[4]},'${e[5]}',1,${ville?.idVille ?? 1},${adminId},'${nowStr}',0)`);
      } catch (err: any) { console.warn(`  ⚠️ ${e[0]}: ${err.message}`); }
    }
  }

  const allEleves: any[] = await q("SELECT matricule FROM Eleve WHERE isDelete=0");
  const matricules = allEleves.map((e: any) => e.matricule);
  console.log(`  ✅ ${matricules.length} élèves\n`);

  // --- Frequente (inscriptions) ---
  console.log("📋 Inscriptions...");
  const cntFreq: any = await q("SELECT COUNT(*) as cnt FROM Frequente");
  if (cntFreq[0]?.cnt === 0) {
    for (let i = 0; i < matricules.length; i++) {
      const clsIdx = i % Math.min(classes.length, 12);
      const cls = classes[clsIdx];
      const salle = salles.find((s: any) => s.idClasse === cls.idClasse) || salles[clsIdx % salles.length];
      try {
        await q(`INSERT INTO Frequente (idSalle,idAcademi,matricule,commentaire,idAdmin,created_at)
          VALUES (${salle.idSalle},${anneeId},${matricules[i]},'',${adminId},'${nowStr}')`);
      } catch (_) {}
    }
  }
  console.log(`  ✅ Inscriptions OK\n`);

  // --- Parents ---
  console.log("👨‍👩‍👧 Parents-Élèves...");
  const cntParents: any = await q("SELECT COUNT(*) as cnt FROM Parents");
  if (cntParents[0]?.cnt === 0) {
    for (let i = 0; i < Math.min(matricules.length, parentPers.length); i++) {
      try {
        await q(`INSERT INTO Parents (idPers,matricule,idAdmin,created_at,isDelete)
          VALUES (${parentPers[i].idPers},${matricules[i]},${adminId},'${nowStr}',0)`);
      } catch (_) {}
    }
  }
  console.log(`  ✅ Parents OK\n`);

  // --- Enseignants ---
  console.log("👩‍🏫 Enseignants-Cours...");
  const cntEns: any = await q("SELECT COUNT(*) as cnt FROM Enseignant");
  if (cntEns[0]?.cnt === 0) {
    for (let i = 0; i < Math.min(enseignants.length, coursList.length); i++) {
      try {
        await q(`INSERT INTO Enseignant (idPers,idCours,Actif,idAdmin,created_at,isDelete)
          VALUES (${enseignants[i].idPers},${coursList[i].idCours},1,${adminId},'${nowStr}',0)`);
      } catch (_) {}
    }
  }
  console.log(`  ✅ Enseignants OK\n`);

  // --- Sessions ---
  console.log("📝 Sessions...");
  const cntSess: any = await q("SELECT COUNT(*) as cnt FROM Session");
  if (cntSess[0]?.cnt === 0 && trimestreIds.length > 0) {
    const ensId = enseignants[0]?.idPers ?? 1;
    await q(`INSERT INTO Session (libelle,description,idTrimestre,idPers,date_passage,created_at)
      VALUES ('1ère Contrôle','Première série de contrôles',${trimestreIds[0]},${ensId},'${today}','${nowStr}')`);
    await q(`INSERT INTO Session (libelle,description,idTrimestre,idPers,date_passage,created_at)
      VALUES ('2ème Contrôle','Deuxième série de contrôles',${trimestreIds[1] || trimestreIds[0]},${ensId},'${today}','${nowStr}')`);
  }
  const allSessions: any[] = await q("SELECT idSession FROM Session");
  console.log(`  ✅ Sessions OK\n`);

  // --- NatureEpreuve ---
  console.log("📋 Types d'épreuves...");
  const cntNat: any = await q("SELECT COUNT(*) as cnt FROM NatureEpreuve");
  if (cntNat[0]?.cnt === 0) {
    for (const lib of ["Contrôle","Examen","Devoir surveillé","Composition"]) {
      try { await q(`INSERT INTO NatureEpreuve (libelle) VALUES ('${lib}')`); } catch (_) {}
    }
  }
  const natures: any[] = await q("SELECT idNature FROM NatureEpreuve");

  // --- Epreuves ---
  console.log("📄 Épreuves...");
  const cntEpr: any = await q("SELECT COUNT(*) as cnt FROM Epreuve");
  if (cntEpr[0]?.cnt === 0 && natures.length > 0 && coursList.length > 0) {
    const ensId = enseignants[0]?.idPers ?? 1;
    for (const c of coursList.slice(0, 10)) {
      try {
        await q(`INSERT INTO Epreuve (libelle,urlDoc,auteur,idNature,idPers,created_at,isDelete)
          VALUES ('${c.libelle} - Contrôle','',(SELECT prenom FROM Personne WHERE idPers=${ensId}),${natures[0].idNature},${ensId},'${nowStr}',0)`);
      } catch (_) {}
    }
  }
  const allEpreuves: any[] = await q("SELECT idEpreuve FROM Epreuve");
  console.log(`  ✅ Épreuves OK\n`);

  // --- Évaluations ---
  console.log("📊 Notes...");
  const cntEval: any = await q("SELECT COUNT(*) as cnt FROM Evaluation");
  if (cntEval[0]?.cnt === 0 && allEpreuves.length > 0 && allSessions.length > 0) {
    const notes = [8,10,12,14,15,7,9,11,13,16,6,10,12,14,8,11,13,15,9,10,7,12,14,11,8,10,13,15,9,11];
    let idx = 0;
    const ensId = enseignants[0]?.idPers ?? 1;
    for (const mat of matricules.slice(0, 15)) {
      for (const ep of allEpreuves.slice(0, 3)) {
        const n = notes[idx % notes.length];
        const app = n >= 14 ? "Bien" : n >= 10 ? "Passable" : "Insuffisant";
        try {
          await q(`INSERT INTO Evaluation (note,appreciation,matricule,idEpreuve,idCours,idSession,idPers,created_at)
            VALUES (${n},'${app}',${mat},${ep.idEpreuve},${coursList[0]?.idCours ?? 1},${allSessions[0].idSession},${ensId},'${nowStr}')`);
        } catch (_) {}
        idx++;
      }
    }
  }
  console.log(`  ✅ Évaluations OK\n`);

  // --- Tranches ---
  console.log("💰 Tranches...");
  const cntTr: any = await q("SELECT COUNT(*) as cnt FROM Tranches");
  if (cntTr[0]?.cnt === 0) {
    for (const sco of scolarites) {
      const amt = Math.round(sco.pension / sco.nbreTranche);
      for (let t = 0; t < sco.nbreTranche; t++) {
        try {
          await q(`INSERT INTO Tranches (libelle,montant,delai_mois,delai_jour,idScolarite,actif,idFondateur)
            VALUES ('Tranche ${t + 1} - ${sco.idCycle}',${amt},${(t + 1) * 3},15,${sco.idScolarite},1,${adminId})`);
        } catch (_) {}
      }
    }
  }
  const allTranches: any[] = await q("SELECT idTranche, libelle FROM Tranches");
  console.log(`  ✅ Tranches OK\n`);

  // --- Paiements ---
  console.log("💸 Paiements...");
  const cntPaie: any = await q("SELECT COUNT(*) as cnt FROM Paiement");
  if (cntPaie[0]?.cnt === 0 && parentPers.length > 0) {
    const montants = [25000,45000,30000,20000,50000,35000,28000,40000,22000,48000];
    const dates = ["2025-09-15","2025-10-01","2025-10-15","2025-11-01","2025-11-15","2025-12-01","2026-01-10","2026-02-01","2026-03-01","2026-04-01"];
    for (let i = 0; i < Math.min(matricules.length, 15); i++) {
      const nb = 1 + (i % 3);
      for (let j = 0; j < nb; j++) {
        const modeIdx = (i + j) % modes.length;
        const dateIdx = (i + j) % dates.length;
        const mnt = montants[(i + j) % montants.length];
        const dt = dates[dateIdx];
        const dtReg = dt + " 08:00:00";
        const trancheIdx = j % allTranches.length;
        const tranche = allTranches[trancheIdx];
        try {
          await q(`INSERT INTO Paiement (matricule,idAca,montant,url,comentaire,idMode,idTranche,operation_ID,idPers,datePaie,dateEnregistrer)
            VALUES (${matricules[i]},${anneeId},${mnt},'','${tranche?.libelle ?? 'Tranche ' + (j + 1)}','${modes[modeIdx].idMode}',${tranche?.idTranche ?? j + 1},'','${parentPers[i % parentPers.length].idPers}','${dt}','${dtReg}')`);
        } catch (_) {}
      }
    }
  }
  console.log(`  ✅ Paiements OK\n`);

  // --- Emploi du temps ---
  console.log("📅 Emploi du temps...");
  const cntEDT: any = await q("SELECT COUNT(*) as cnt FROM EmploiDuTemps");
  if (cntEDT[0]?.cnt === 0) {
    const jours = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
    const heures = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00"];
    for (const cls of classes.slice(0, 6)) {
      const clsCours = coursList.filter((c: any) => c.idClasse === cls.idClasse);
      const salle = salles.find((s: any) => s.idClasse === cls.idClasse);
      for (let j = 0; j < Math.min(jours.length, clsCours.length); j++) {
        try {
          await q(`INSERT INTO EmploiDuTemps (jour,heure,idClasse,idCours,idSalle,idAdmin,created_at)
            VALUES ('${jours[j]}','${heures[j % heures.length]}',${cls.idClasse},${clsCours[j].idCours},${salle?.idSalle ?? 'NULL'},${adminId},'${nowStr}')`);
        } catch (_) {}
      }
    }
  }
  console.log(`  ✅ Emploi du temps OK\n`);

  // --- Messages ---
  console.log("💬 Messages...");
  const cntMsg: any = await q("SELECT COUNT(*) as cnt FROM Messages");
  if (cntMsg[0]?.cnt === 0 && parentPers.length > 0) {
    const ensId = enseignants[0]?.idPers ?? 1;
    const ensNom = enseignants[0]?.nom ?? "";
    const ensPrenom = enseignants[0]?.prenom ?? "";
    const msgData = [
      ["Réunion parents-professeurs","Une réunion est prévue le 15 janvier 2026 pour discuter des résultats du 1er trimestre.",1],
      ["Résultats du 1er trimestre","Les bulletins du 1er trimestre sont disponibles. Merci de les récupérer au secrétariat.",1],
      ["Fête de l'école","La fête de l'école aura lieu le 28 février. Les élèves doivent participer.",0],
    ];
    for (let i = 0; i < msgData.length; i++) {
      const m = msgData[i];
      const pp = parentPers[i % parentPers.length];
      try {
        await q(`INSERT INTO Messages (idExp_Pers,senderRole,senderId,senderLabel,receiverRole,receiverId,receiverLabel,idParent,objet,subject,content,information,type_message,AnneeAcade,created_at,valider,isRead,updated_at)
          VALUES (${ensId},'enseignant','${ensId}','${ensPrenom} ${ensNom}','parent','${pp.idPers}','${pp.prenom} ${pp.nom}',0,'${m[0]}','${m[0]}','${m[1]}','${m[1]}',1,'${currentAnnee?.libelle ?? "2025-2026"}','${nowStr}',${m[2]},${i === 0 ? 1 : 0},'${nowStr}')`);
      } catch (_) {}
    }
  }
  console.log(`  ✅ Messages OK\n`);

  console.log("🎉 Enrichissement terminé !");
  console.log(`   ${matricules.length} élèves | ${parentPers.length} parents | ${enseignants.length} enseignants`);
  conn.release();
}

seedData()
  .catch((err) => { console.error("❌ Erreur:", err); process.exit(1); })
  .finally(async () => { await (pool as any).end(); process.exit(0); });
