-- ============================================================
-- FIX SCRIPT : Correction des données mbeng patricia
-- Le premier script utilisait des IDs wrong (classes commencent à 5, pas 1)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PHASE 1 : NETTOYAGE des données incorrectes
-- ════════════════════════════════════════════════════════════

-- Supprimer les Enseignant de mbeng (qui référencent de mauvais cours)
DELETE FROM Enseignant WHERE idPers = 1 AND idEnseignant >= 248;

-- Supprimer les Cours orphelins (idCours 6-11, idClasse 2/3 inexistants)
DELETE FROM Cours WHERE idCours BETWEEN 6 AND 11;

-- Supprimer les élèves créés par le mauvais script (matricule >= 415)
DELETE FROM Eleve WHERE matricule >= 415;

-- Supprimer les Frequente du mauvais script
DELETE FROM Frequente WHERE idFrequente >= 1637;

-- Supprimer les Titulaire de mbeng
DELETE FROM Titulaire WHERE idPers = 1;

-- Supprimer les NatureEpreuve dupliquées (6-8)
DELETE FROM NatureEpreuve WHERE idNature >= 6;

-- Supprimer les Epreuves de mbeng (les 8 du mauvais script)
DELETE FROM Epreuve WHERE idPers = 1 AND idEpreuve >= 21;

-- Supprimer les Sessions de mbeng (les 3 du mauvais script: id 10,11,12)
DELETE FROM Session WHERE idPers = 1 AND idSession >= 10;

-- Supprimer les Evaluations de mbeng (celles liées aux mauvais cours)
DELETE FROM Evaluation WHERE idPers = 1 AND idEval >= 32;

-- Supprimer les EmploiDuTemps du mauvais script
DELETE FROM EmploiDuTemps WHERE idTemps >= 179;

-- Supprimer les Messages du mauvais script (ids 6-10)
DELETE FROM Messages WHERE idMessages IN (6, 7, 8, 9, 10);

-- Supprimer les anciennes sessions de mbeng (ids 1-9, liées aux mauvais trimestres)
DELETE FROM Session WHERE idPers = 1 AND idSession BETWEEN 1 AND 9;

-- Réinitialiser la classe titulaire
UPDATE Classe SET titulaire = NULL WHERE titulaire = 1;


-- ════════════════════════════════════════════════════════════
-- PHASE 2 : RE-INSERTION avec les bons IDs
--
-- IDs corrects du système :
--   Class 1 A : idClasse=5,  idSalle=23
--   Class 1 B : idClasse=23, idSalle=42
--   Class 2 A : idClasse=6,  idSalle=24
--   Class 2 B : idClasse=24, idSalle=43
--   Class 3 A : idClasse=7,  idSalle=25
--
-- Cours existants (seed) :
--   Class 1 A (idClasse=5):  96=Mathematics, 97=English Language, 98=General Science, 99=Civic Education, 100=PE
--   Class 2 A (idClasse=6): 101=Mathematics, 102=English Language, 103=General Science, 104=History&Geography, 105=Civic Education
--
-- Annee Académique : idAnnee=3 (2026-2027)
-- Trimestres 2026-2027 : idTrimes=7,8,9
-- ════════════════════════════════════════════════════════════

-- 1. TITULAIRE : Mbeng est titulaire de Class 1 A (idClasse=5)
UPDATE Classe SET titulaire = 1 WHERE idClasse = 5;

INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at)
VALUES (1, 23, 1, 1, NOW());

-- 2. ENSEIGNANT : Mbeng enseigne
--    - Mathematics + English Language + General Science en Class 1 A (cours 96, 97, 98)
--    - Mathematics + English Language en Class 2 A (cours 101, 102)
INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at, isDelete)
VALUES
  (1,  96, 1, 1, NOW(), 0),   -- Mathematics     → Class 1 A
  (1,  97, 1, 1, NOW(), 0),   -- English Language  → Class 1 A
  (1,  98, 1, 1, NOW(), 0),   -- General Science   → Class 1 A
  (1, 101, 1, 1, NOW(), 0),   -- Mathematics     → Class 2 A
  (1, 102, 1, 1, NOW(), 0);   -- English Language  → Class 2 A

-- 3. ÉLÈVES : 20 élèves répartis dans les classes de mbeng
--    matricules auto-incrémentés : 435-454
INSERT INTO Eleve (nom, prenom, dateNaissance, lieuNaissance, sexe, langue, actif, idVilleNaissance, idAdmin, created_at, isDelete)
VALUES
  -- Class 1 A (8 élèves → salle 23)
  ('Nkoulou',      'Samuel',    '2012-03-15', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Fouda',        'Alice',     '2012-07-22', 'Douala',     2, 'Français', 1, 2, 1, NOW(), 0),
  ('Mbarga',       'David',     '2011-11-08', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Ngono',        'Carine',    '2012-01-30', 'Bamenda',    2, 'Anglais',  1, 3, 1, NOW(), 0),
  ('Ekotto',       'Paul',      '2012-05-12', 'Bafoussam',  1, 'Français', 1, 4, 1, NOW(), 0),
  ('Mbida',        'Thérèse',   '2011-09-25', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Tchinda',      'Cécile',    '2012-04-18', 'Douala',     2, 'Français', 1, 2, 1, NOW(), 0),
  ('Atangana',     'Marie',     '2011-12-03', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  -- Class 1 B (6 élèves → salle 42)
  ('Sone',         'Marc',      '2012-08-14', 'Garoua',     1, 'Français', 1, 5, 1, NOW(), 0),
  ('Essomba',      'Pierre',    '2011-06-20', 'Maroua',     1, 'Français', 1, 6, 1, NOW(), 0),
  ('Tchoupa',      'Isaac',     '2012-02-11', 'Bertoua',    1, 'Français', 1, 7, 1, NOW(), 0),
  ('Bikoi',        'Sylvie',    '2012-10-05', 'Ebolowa',    2, 'Français', 1, 8, 1, NOW(), 0),
  ('Nkoula',       'Georges',   '2011-08-19', 'Kribi',      1, 'Français', 1, 9, 1, NOW(), 0),
  ('Fokou',        'Aimée',     '2012-06-28', 'Limbe',      2, 'Anglais',  1, 10, 1, NOW(), 0),
  -- Class 2 A (6 élèves → salle 24)
  ('Effa',         'Valérie',   '2011-04-07', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Tchango',      'Robert',    '2012-09-16', 'Douala',     1, 'Français', 1, 2, 1, NOW(), 0),
  ('Ngono',        'Hélène',    '2011-07-02', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Zafack',       'Diane',     '2012-12-21', 'Bafoussam',  2, 'Français', 1, 4, 1, NOW(), 0),
  ('Tchatchoua',   'Daniel',    '2011-05-30', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Manga',        'David',     '2012-11-09', 'Bamenda',    1, 'Anglais',  1, 3, 1, NOW(), 0);

-- 4. PARENTS : Lier les personnes parent (idPers 9-24) aux premiers élèves
--    Les élèves commencent à matricule = 435
INSERT INTO Parents (idPers, matricule, idAdmin, created_at)
VALUES
  ( 9, 435, 1, NOW()),   -- Ekotto Andre       → Nkoulou Samuel
  (10, 436, 1, NOW()),   -- Mbida Thérèse      → Fouda Alice
  (11, 437, 1, NOW()),   -- Cameroon Joseph    → Mbarga David
  (12, 438, 1, NOW()),   -- Nguetsop Marthe    → Ngono Carine
  (13, 439, 1, NOW()),   -- Tchoupa Isaac      → Ekotto Paul
  (14, 440, 1, NOW()),   -- Bikoi Sylvie       → Mbida Thérèse
  (15, 441, 1, NOW()),   -- Mbarga Emmanuel    → Tchinda Cécile
  (16, 442, 1, NOW()),   -- Tadadjeu Brigitte  → Atangana Marie
  (17, 443, 1, NOW()),   -- Nkoula Georges     → Sone Marc
  (18, 444, 1, NOW()),   -- Fokou Aimée        → Essomba Pierre
  (19, 445, 1, NOW()),   -- Sone Marc          → Tchoupa Isaac
  (20, 446, 1, NOW()),   -- Effa Valérie       → Bikoi Sylvie
  (21, 447, 1, NOW()),   -- Tchango Robert     → Nkoula Georges
  (22, 448, 1, NOW()),   -- Ngono Hélène       → Fokou Aimée
  (23, 449, 1, NOW()),   -- Tchatchoua Daniel  → Effa Valérie
  (24, 450, 1, NOW());   -- Zafack Diane       → Tchango Robert

-- 5. FREQUENTE : Inscrire les élèves dans leurs classes
--    idAcademi=3 = 2026-2027, idSalle selon la classe
INSERT INTO Frequente (idSalle, idAcademi, matricule, commentaire, idAdmin, created_at)
VALUES
  -- Class 1 A → salle 23 (8 élèves: matricules 435-442)
  (23, 3, 435, '', 1, NOW()),
  (23, 3, 436, '', 1, NOW()),
  (23, 3, 437, '', 1, NOW()),
  (23, 3, 438, '', 1, NOW()),
  (23, 3, 439, '', 1, NOW()),
  (23, 3, 440, '', 1, NOW()),
  (23, 3, 441, '', 1, NOW()),
  (23, 3, 442, '', 1, NOW()),
  -- Class 1 B → salle 42 (6 élèves: matricules 443-448)
  (42, 3, 443, '', 1, NOW()),
  (42, 3, 444, '', 1, NOW()),
  (42, 3, 445, '', 1, NOW()),
  (42, 3, 446, '', 1, NOW()),
  (42, 3, 447, '', 1, NOW()),
  (42, 3, 448, '', 1, NOW()),
  -- Class 2 A → salle 24 (6 élèves: matricules 449-454)
  (24, 3, 449, '', 1, NOW()),
  (24, 3, 450, '', 1, NOW()),
  (24, 3, 451, '', 1, NOW()),
  (24, 3, 452, '', 1, NOW()),
  (24, 3, 453, '', 1, NOW()),
  (24, 3, 454, '', 1, NOW());

-- 6. ÉPREUVES (réutiliser les natures existantes: idNature 1-5)
INSERT INTO Epreuve (libelle, urlDoc, auteur, idNature, idPers, created_at, isDelete)
VALUES
  ('DS1 Mathematics T1',    '', 'Mbeng Patricia', 3, 1, NOW(), 0),
  ('DS1 English T1',         '', 'Mbeng Patricia', 3, 1, NOW(), 0),
  ('Examen T1 Mathematics',  '', 'Mbeng Patricia', 2, 1, NOW(), 0),
  ('DS2 Mathematics T2',     '', 'Mbeng Patricia', 3, 1, NOW(), 0),
  ('DS2 English T2',          '', 'Mbeng Patricia', 3, 1, NOW(), 0),
  ('Examen T2 Mathematics',  '', 'Mbeng Patricia', 2, 1, NOW(), 0),
  ('DS1 General Science T1', '', 'Mbeng Patricia', 3, 1, NOW(), 0),
  ('Composition Mathematics','', 'Mbeng Patricia', 5, 1, NOW(), 0);

-- 7. SESSIONS : liées aux trimestres 2026-2027 (idTrimes 7,8,9)
INSERT INTO Session (libelle, description, idTrimestre, idPers, date_passage, created_at)
VALUES
  ('Évaluations T1', 'Évaluations 1er trimestre 2026-2027',  7, 1, '2026-12-15', NOW()),
  ('Évaluations T2', 'Évaluations 2ème trimestre 2026-2027', 8, 1, '2027-03-20', NOW()),
  ('Évaluations T3', 'Évaluations 3ème trimestre 2026-2027', 9, 1, '2027-06-10', NOW());

-- 8. ÉVALUATIONS : notes variées pour le pie chart
--    matricules 435-442 = Class 1 A, 449-454 = Class 2 A
--    cours 96=Math(Class1A), 97=English(Class1A), 98=Science(Class1A), 101=Math(Class2A), 102=English(Class2A)
--    Sessions: idSession 1=T1, 2=T2, 3=T3

-- ── Cours 96 : Mathematics Class 1 A (élèves 435-442) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (15.5, 'Très bien',   435, 1, 96, 1, 1, NOW()),
  (12.0, 'Bien',        436, 1, 96, 1, 1, NOW()),
  ( 8.5, 'Insuffisant', 437, 1, 96, 1, 1, NOW()),
  (17.0, 'Excellent',   438, 1, 96, 1, 1, NOW()),
  (10.5, 'Passable',    439, 1, 96, 1, 1, NOW()),
  (14.0, 'Bien',        440, 1, 96, 1, 1, NOW()),
  ( 6.0, 'Mauvais',     441, 1, 96, 1, 1, NOW()),
  (11.0, 'Passable',    442, 1, 96, 1, 1, NOW());

-- ── Cours 97 : English Language Class 1 A (élèves 435-442) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (13.5, 'Bien',        435, 2, 97, 1, 1, NOW()),
  (16.0, 'Très bien',   436, 2, 97, 1, 1, NOW()),
  ( 9.0, 'Insuffisant', 437, 2, 97, 1, 1, NOW()),
  (18.5, 'Excellent',   438, 2, 97, 1, 1, NOW()),
  (11.5, 'Passable',    439, 2, 97, 1, 1, NOW()),
  ( 7.0, 'Insuffisant', 440, 2, 97, 1, 1, NOW()),
  (14.5, 'Bien',        441, 2, 97, 1, 1, NOW()),
  (12.5, 'Bien',        442, 2, 97, 1, 1, NOW());

-- ── Cours 98 : General Science Class 1 A (élèves 435-442) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (10.0, 'Passable',    435, 7, 98, 1, 1, NOW()),
  (15.0, 'Très bien',   436, 7, 98, 1, 1, NOW()),
  ( 4.5, 'Mauvais',     437, 7, 98, 1, 1, NOW()),
  (16.5, 'Très bien',   438, 7, 98, 1, 1, NOW()),
  ( 9.5, 'Insuffisant', 439, 7, 98, 1, 1, NOW()),
  (12.0, 'Bien',        440, 7, 98, 1, 1, NOW()),
  (11.0, 'Passable',    441, 7, 98, 1, 1, NOW()),
  ( 8.0, 'Insuffisant', 442, 7, 98, 1, 1, NOW());

-- ── Cours 101 : Mathematics Class 2 A (élèves 449-454) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (14.0, 'Bien',        449, 4, 101, 2, 1, NOW()),
  ( 9.5, 'Insuffisant', 450, 4, 101, 2, 1, NOW()),
  (11.0, 'Passable',    451, 4, 101, 2, 1, NOW()),
  (13.0, 'Bien',        452, 4, 101, 2, 1, NOW()),
  ( 7.5, 'Insuffisant', 453, 4, 101, 2, 1, NOW()),
  (16.0, 'Très bien',   454, 4, 101, 2, 1, NOW());

-- ── Cours 102 : English Language Class 2 A (élèves 449-454) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (12.5, 'Bien',        449, 5, 102, 2, 1, NOW()),
  (10.0, 'Passable',    450, 5, 102, 2, 1, NOW()),
  (15.5, 'Très bien',   451, 5, 102, 2, 1, NOW()),
  ( 8.0, 'Insuffisant', 452, 5, 102, 2, 1, NOW()),
  (17.0, 'Excellent',   453, 5, 102, 2, 1, NOW()),
  (11.5, 'Passable',    454, 5, 102, 2, 1, NOW());

-- 9. EMPLOI DU TEMPS : avec les vrais idClasse et idSalle
INSERT INTO EmploiDuTemps (jour, heure, idClasse, idCours, idSalle, idAdmin, created_at)
VALUES
  ('Lundi',     '08:00', 5,  96, 23, 1, NOW()),   -- Mathematics      Class 1 A
  ('Lundi',     '10:00', 5,  97, 23, 1, NOW()),   -- English Language  Class 1 A
  ('Mardi',     '08:00', 5,  98, 23, 1, NOW()),   -- General Science   Class 1 A
  ('Mardi',     '10:00', 6, 101, 24, 1, NOW()),   -- Mathematics      Class 2 A
  ('Mercredi',  '08:00', 6, 102, 24, 1, NOW()),   -- English Language  Class 2 A
  ('Mercredi',  '10:00', 5,  96, 23, 1, NOW()),   -- Mathematics      Class 1 A (2ème fois)
  ('Jeudi',     '08:00', 5,  97, 23, 1, NOW()),   -- English Language  Class 1 A (2ème fois)
  ('Jeudi',     '10:00', 6, 101, 24, 1, NOW()),   -- Mathematics      Class 2 A (2ème fois)
  ('Vendredi',  '08:00', 5,  98, 23, 1, NOW()),   -- General Science   Class 1 A (2ème fois)
  ('Vendredi',  '10:00', 6, 102, 24, 1, NOW());   -- English Language  Class 2 A (2ème fois)

-- 10. MESSAGES : 5 messages de mbeng à des parents
--     Les parents idParent 1-16 existent déjà (liés aux personnes 9-24)
INSERT INTO Messages (idExp_Pers, senderRole, senderId, senderLabel, receiverRole, receiverId, receiverLabel, idParent, objet, subject, content, information, type_message, AnneeAcade, created_at, valider, isRead, updated_at)
VALUES
  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '1', 'Ekotto Andre', 1,
   'Réunion parents-professeurs',
   'Réunion',
   'Madame, Monsieur, une réunion parents-professeurs est prévue le 20 juillet à 15h dans la salle polyvalente. Votre présence est souhaitée.',
   'Réunion parents-professeurs le 20 juillet à 15h.',
   1, '2026-2027', NOW(), 1, 0, NOW()),

  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '2', 'Mbida Therese', 2,
   'Bulletin du 1er trimestre',
   'Bulletin',
   'Les bulletins du 1er trimestre sont disponibles. Vous pouvez les récupérer au secrétariat.',
   'Bulletin du 1er trimestre disponible au secrétariat.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 3 DAY), 1, 1, NOW()),

  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '3', 'Cameroon Joseph', 3,
   'Rappel : devoirs de mathématiques',
   'Devoirs',
   'N''oubliez pas les devoirs de mathématiques à rendre pour lundi matin. Exercices pages 45-47.',
   'Rappel: devoirs de maths rendus lundi.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 1 DAY), 1, 0, NOW()),

  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '4', 'Nguetsop Marthe', 4,
   'Résultats de l''examen de anglais',
   'Résultats',
   'Les résultats de l''examen de anglais du 1er trimestre sont publiés. Notes moyennes : 12.3/20.',
   'Résultats examen de anglais disponibles.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 5 DAY), 1, 1, NOW()),

  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '5', 'Tchoupa Isaac', 5,
   'Excursion scolaire',
   'Excursion',
   'Une excursion scolaire au musée est organisée le 30 juillet. Merci de signer le formulaire de consentement.',
   'Excursion scolaire le 30 juillet. Consentement requis.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 7 DAY), 1, 0, NOW());
