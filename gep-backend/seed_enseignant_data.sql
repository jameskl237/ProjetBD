-- ============================================================
-- SCRIPT SQL : Données de test pour MBENG Patricia
-- Enseignante login: mbeng, password: Password@2026
-- idPers = 1, Admin = 1 (directeur)
--
-- Prérequis: le seed de base (src/seed.ts) doit avoir été exécuté
-- pour créer les tables, les admins, les personnes, classes, etc.
--
-- Pour exécuter:
--   mysql -u ecole -p ecole2026 < seed_enseignant_data.sql
--   ou via le shell:  mysql -h 127.0.0.1 -P 3307 -u ecole -p ecole2026 < seed_enseignant_data.sql
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. COURS SUPPLÉMENTAIRES
--    Le seed ne crée que 5 cours (1 par matière) pour Class 1 A
--    (idCours 1-5, tous idClasse=1) à cause du doublon sur libelle.
--    On en ajoute pour Class 1 B (idClasse=2) et Class 2 A (idClasse=3)
-- ════════════════════════════════════════════════════════════
INSERT INTO Cours (libelle, coefficient, description, idClasse, actif, idAdmin, created_at, isDelete)
VALUES
  ('Mathématiques',  3, 'Mathématiques',         2, 1, 1, NOW(), 0),  -- idCours 6
  ('Français',       3, 'Langue française',       2, 1, 1, NOW(), 0),  -- idCours 7
  ('Anglais',        3, 'Langue anglaise',         2, 1, 1, NOW(), 0),  -- idCours 8
  ('Mathématiques',  3, 'Mathématiques',         3, 1, 1, NOW(), 0),  -- idCours 9
  ('Français',       3, 'Langue française',       3, 1, 1, NOW(), 0),  -- idCours 10
  ('Anglais',        3, 'Langue anglaise',         3, 1, 1, NOW(), 0);  -- idCours 11

-- ════════════════════════════════════════════════════════════
-- 2. AFFECTATION ENSEIGNANTE
--    Mbeng enseigne:
--      - Math, Français, Anglais en Class 1 A (cours 1, 2, 3)
--      - Math, Français en Class 2 A (cours 9, 10)
--    → 5 cours, 2 classes distinctes
-- ════════════════════════════════════════════════════════════
INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at, isDelete)
VALUES
  (1,  1,  1, 1, NOW(), 0),   -- Math      → Class 1 A
  (1,  2,  1, 1, NOW(), 0),   -- Français  → Class 1 A
  (1,  3,  1, 1, NOW(), 0),   -- Anglais   → Class 1 A
  (1,  9,  1, 1, NOW(), 0),   -- Math      → Class 2 A
  (1, 10,  1, 1, NOW(), 0);   -- Français  → Class 2 A

-- ════════════════════════════════════════════════════════════
-- 3. TITULAIRE
--    Mbeng est titulaire de Class 1 A (idClasse=1, salle idSalle=1)
--    Le dashboard interroge Classe.titulaire (colonne int)
-- ════════════════════════════════════════════════════════════
UPDATE Classe SET titulaire = 1 WHERE idClasse = 1;

INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at)
VALUES (1, 1, 1, 1, NOW());

-- ════════════════════════════════════════════════════════════
-- 4. ÉLÈVES  (20 élèves, matricule auto-incrémenté 1→20)
--    Répartition:
--      matricule  1-8  → Class 1 A  (titulaire de mbeng)
--      matricule  9-14 → Class 1 B
--      matricule 15-20 → Class 2 A
-- ════════════════════════════════════════════════════════════
INSERT INTO Eleve (nom, prenom, dateNaissance, lieuNaissance, sexe, langue, actif, idVilleNaissance, idAdmin, created_at, isDelete)
VALUES
  ('Nkoulou',      'Samuel',    '2012-03-15', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Fouda',        'Alice',     '2012-07-22', 'Douala',     2, 'Français', 1, 2, 1, NOW(), 0),
  ('Mbarga',       'David',     '2011-11-08', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Ngono',        'Carine',    '2012-01-30', 'Bamenda',    2, 'Anglais',  1, 3, 1, NOW(), 0),
  ('Ekotto',       'Paul',      '2012-05-12', 'Bafoussam',  1, 'Français', 1, 4, 1, NOW(), 0),
  ('Mbida',        'Thérèse',   '2011-09-25', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Tchinda',      'Cécile',    '2012-04-18', 'Douala',     2, 'Français', 1, 2, 1, NOW(), 0),
  ('Atangana',     'Marie',     '2011-12-03', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Sone',         'Marc',      '2012-08-14', 'Garoua',     1, 'Français', 1, 5, 1, NOW(), 0),
  ('Essomba',      'Pierre',    '2011-06-20', 'Maroua',     1, 'Français', 1, 6, 1, NOW(), 0),
  ('Tchoupa',      'Isaac',     '2012-02-11', 'Bertoua',    1, 'Français', 1, 7, 1, NOW(), 0),
  ('Bikoi',        'Sylvie',    '2012-10-05', 'Ebolowa',    2, 'Français', 1, 8, 1, NOW(), 0),
  ('Nkoula',       'Georges',   '2011-08-19', 'Kribi',      1, 'Français', 1, 9, 1, NOW(), 0),
  ('Fokou',        'Aimée',     '2012-06-28', 'Limbe',      2, 'Anglais',  1, 10, 1, NOW(), 0),
  ('Effa',         'Valérie',   '2011-04-07', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Tchango',      'Robert',    '2012-09-16', 'Douala',     1, 'Français', 1, 2, 1, NOW(), 0),
  ('Ngono',        'Hélène',    '2011-07-02', 'Yaoundé',   2, 'Français', 1, 1, 1, NOW(), 0),
  ('Zafack',       'Diane',     '2012-12-21', 'Bafoussam',  2, 'Français', 1, 4, 1, NOW(), 0),
  ('Tchatchoua',   'Daniel',    '2011-05-30', 'Yaoundé',   1, 'Français', 1, 1, 1, NOW(), 0),
  ('Manga',        'David',     '2012-11-09', 'Bamenda',    1, 'Anglais',  1, 3, 1, NOW(), 0);

-- ════════════════════════════════════════════════════════════
-- 5. PARENTS  (lier les personnes parent idPers 9-24 aux élèves)
-- ════════════════════════════════════════════════════════════
INSERT INTO Parents (idPers, matricule, idAdmin, created_at)
VALUES
  ( 9,  1, 1, NOW()),   -- Ekotto Andre        → Nkoulou Samuel
  (10,  2, 1, NOW()),   -- Mbida Thérèse       → Fouda Alice
  (11,  3, 1, NOW()),   -- Cameroon Joseph     → Mbarga David
  (12,  4, 1, NOW()),   -- Nguetsop Marthe     → Ngono Carine
  (13,  5, 1, NOW()),   -- Tchoupa Isaac       → Ekotto Paul
  (14,  6, 1, NOW()),   -- Bikoi Sylvie        → Mbida Thérèse
  (15,  7, 1, NOW()),   -- Mbarga Emmanuel     → Tchinda Cécile
  (16,  8, 1, NOW()),   -- Tadadjeu Brigitte   → Atangana Marie
  (17,  9, 1, NOW()),   -- Nkoula Georges      → Sone Marc
  (18, 10, 1, NOW()),   -- Fokou Aimée         → Essomba Pierre
  (19, 11, 1, NOW()),   -- Sone Marc           → Tchoupa Isaac
  (20, 12, 1, NOW()),   -- Effa Valérie        → Bikoi Sylvie
  (21, 13, 1, NOW()),   -- Tchango Robert      → Nkoula Georges
  (22, 14, 1, NOW()),   -- Ngono Hélène        → Fokou Aimée
  (23, 15, 1, NOW()),   -- Tchatchoua Daniel   → Effa Valérie
  (24, 16, 1, NOW());   -- Zafack Diane        → Tchango Robert

-- ════════════════════════════════════════════════════════════
-- 6. FREQUENTE  (inscription des élèves aux classes)
--    idSalle → Salle-Class-X-Y → idClasse
--    idAcademi → 3 (année 2026-2027)
-- ════════════════════════════════════════════════════════════
INSERT INTO Frequente (idSalle, idAcademi, matricule, commentaire, idAdmin, created_at)
VALUES
  -- Class 1 A → salle 1
  (1, 3,  1, '', 1, NOW()),
  (1, 3,  2, '', 1, NOW()),
  (1, 3,  3, '', 1, NOW()),
  (1, 3,  4, '', 1, NOW()),
  (1, 3,  5, '', 1, NOW()),
  (1, 3,  6, '', 1, NOW()),
  (1, 3,  7, '', 1, NOW()),
  (1, 3,  8, '', 1, NOW()),
  -- Class 1 B → salle 2
  (2, 3,  9, '', 1, NOW()),
  (2, 3, 10, '', 1, NOW()),
  (2, 3, 11, '', 1, NOW()),
  (2, 3, 12, '', 1, NOW()),
  (2, 3, 13, '', 1, NOW()),
  (2, 3, 14, '', 1, NOW()),
  -- Class 2 A → salle 3
  (3, 3, 15, '', 1, NOW()),
  (3, 3, 16, '', 1, NOW()),
  (3, 3, 17, '', 1, NOW()),
  (3, 3, 18, '', 1, NOW()),
  (3, 3, 19, '', 1, NOW()),
  (3, 3, 20, '', 1, NOW());

-- ════════════════════════════════════════════════════════════
-- 7. NATURES D'ÉPREUVE
-- ════════════════════════════════════════════════════════════
INSERT INTO NatureEpreuve (libelle, description)
VALUES
  ('Devoir surveillé',      'Devoir en classe'),
  ('Examen trimestriel',    'Examen de fin de trimestre'),
  ('Composition',           'Composition annuelle');

-- ════════════════════════════════════════════════════════════
-- 8. ÉPREUVES
-- ════════════════════════════════════════════════════════════
INSERT INTO Epreuve (libelle, urlDoc, auteur, idNature, idPers, created_at, isDelete)
VALUES
  ('DS1 Mathématiques T1',         '', 'Mbeng Patricia', 1, 1, NOW(), 0),
  ('DS1 Français T1',              '', 'Mbeng Patricia', 1, 1, NOW(), 0),
  ('Examen T1 Mathématiques',      '', 'Mbeng Patricia', 2, 1, NOW(), 0),
  ('DS2 Mathématiques T2',         '', 'Mbeng Patricia', 1, 1, NOW(), 0),
  ('DS2 Français T2',              '', 'Mbeng Patricia', 1, 1, NOW(), 0),
  ('Examen T2 Mathématiques',      '', 'Mbeng Patricia', 2, 1, NOW(), 0),
  ('DS1 Anglais T1',               '', 'Mbeng Patricia', 1, 1, NOW(), 0),
  ('Composition Mathématiques',    '', 'Mbeng Patricia', 3, 1, NOW(), 0);

-- ════════════════════════════════════════════════════════════
-- 9. SESSIONS  (liées aux trimestres de l'année 2026-2027)
-- ════════════════════════════════════════════════════════════
INSERT INTO Session (libelle, description, idTrimestre, idPers, date_passage, created_at)
VALUES
  ('Session T1', 'Évaluations 1er trimestre',  1, 1, '2026-10-15', NOW()),
  ('Session T2', 'Évaluations 2ème trimestre', 2, 1, '2027-02-20', NOW()),
  ('Session T3', 'Évaluations 3ème trimestre', 3, 1, '2027-05-25', NOW());

-- ════════════════════════════════════════════════════════════
-- 10. ÉVALUATIONS  (notes pour le pie chart + tableau)
--     Répartition voulue pour un joli graphique:
--       0–4.9    : quelques notes (2-3)
--       5–9.9    : quelques notes (4-5)
--       10–14.9  : la majorité (12-15)
--       15–20    : quelques notes (5-6)
-- ════════════════════════════════════════════════════════════

-- ── Cours 1 : Mathématiques Class 1 A (élèves 1-8) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (15.5, 'Très bien',   1, 1, 1, 1, 1, NOW()),
  (12.0, 'Bien',        2, 1, 1, 1, 1, NOW()),
  ( 8.5, 'Insuffisant', 3, 1, 1, 1, 1, NOW()),
  (17.0, 'Excellent',   4, 1, 1, 1, 1, NOW()),
  (10.5, 'Passable',    5, 1, 1, 1, 1, NOW()),
  (14.0, 'Bien',        6, 1, 1, 1, 1, NOW()),
  ( 6.0, 'Mauvais',     7, 1, 1, 1, 1, NOW()),
  (11.0, 'Passable',    8, 1, 1, 1, 1, NOW());

-- ── Cours 2 : Français Class 1 A (élèves 1-8) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (13.5, 'Bien',        1, 2, 2, 1, 1, NOW()),
  (16.0, 'Très bien',   2, 2, 2, 1, 1, NOW()),
  ( 9.0, 'Insuffisant', 3, 2, 2, 1, 1, NOW()),
  (18.5, 'Excellent',   4, 2, 2, 1, 1, NOW()),
  (11.5, 'Passable',    5, 2, 2, 1, 1, NOW()),
  ( 7.0, 'Insuffisant', 6, 2, 2, 1, 1, NOW()),
  (14.5, 'Bien',        7, 2, 2, 1, 1, NOW()),
  (12.5, 'Bien',        8, 2, 2, 1, 1, NOW());

-- ── Cours 3 : Anglais Class 1 A (élèves 1-8) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (10.0, 'Passable',    1, 7, 3, 1, 1, NOW()),
  (15.0, 'Très bien',   2, 7, 3, 1, 1, NOW()),
  ( 4.5, 'Mauvais',     3, 7, 3, 1, 1, NOW()),
  (16.5, 'Très bien',   4, 7, 3, 1, 1, NOW()),
  ( 9.5, 'Insuffisant', 5, 7, 3, 1, 1, NOW()),
  (12.0, 'Bien',        6, 7, 3, 1, 1, NOW()),
  (11.0, 'Passable',    7, 7, 3, 1, 1, NOW()),
  ( 8.0, 'Insuffisant', 8, 7, 3, 1, 1, NOW());

-- ── Cours 9 : Mathématiques Class 2 A (élèves 15-20) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (14.0, 'Bien',        15, 4, 9, 2, 1, NOW()),
  ( 9.5, 'Insuffisant', 16, 4, 9, 2, 1, NOW()),
  (11.0, 'Passable',    17, 4, 9, 2, 1, NOW()),
  (13.0, 'Bien',        18, 4, 9, 2, 1, NOW()),
  ( 7.5, 'Insuffisant', 19, 4, 9, 2, 1, NOW()),
  (16.0, 'Très bien',   20, 4, 9, 2, 1, NOW());

-- ── Cours 10 : Français Class 2 A (élèves 15-20) ──
INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at)
VALUES
  (12.5, 'Bien',        15, 5, 10, 2, 1, NOW()),
  (10.0, 'Passable',    16, 5, 10, 2, 1, NOW()),
  (15.5, 'Très bien',   17, 5, 10, 2, 1, NOW()),
  ( 8.0, 'Insuffisant', 18, 5, 10, 2, 1, NOW()),
  (17.0, 'Excellent',   19, 5, 10, 2, 1, NOW()),
  (11.5, 'Passable',    20, 5, 10, 2, 1, NOW());

-- ════════════════════════════════════════════════════════════
-- 11. EMPLOI DU TEMPS
--     Créneaux répartis sur la semaine pour les cours de mbeng
-- ════════════════════════════════════════════════════════════
INSERT INTO EmploiDuTemps (jour, heure, idClasse, idCours, idSalle, idAdmin, created_at)
VALUES
  ('Lundi',     '08:00', 1,  1, 1, 1, NOW()),   -- Math      Class 1 A
  ('Lundi',     '10:00', 1,  2, 1, 1, NOW()),   -- Français  Class 1 A
  ('Mardi',     '08:00', 1,  3, 1, 1, NOW()),   -- Anglais   Class 1 A
  ('Mardi',     '10:00', 3,  9, 3, 1, NOW()),   -- Math      Class 2 A
  ('Mercredi',  '08:00', 3, 10, 3, 1, NOW()),   -- Français  Class 2 A
  ('Mercredi',  '10:00', 1,  4, 1, 1, NOW()),   -- Sci. Nat. Class 1 A
  ('Jeudi',     '08:00', 1,  1, 1, 1, NOW()),   -- Math      Class 1 A
  ('Jeudi',     '10:00', 3,  9, 3, 1, NOW()),   -- Math      Class 2 A
  ('Vendredi',  '08:00', 1,  5, 1, 1, NOW()),   -- Hist-Géo  Class 1 A
  ('Vendredi',  '10:00', 3, 10, 3, 1, NOW());   -- Français  Class 2 A

-- ════════════════════════════════════════════════════════════
-- 12. MESSAGES  (5 messages de mbeng à des parents)
-- ════════════════════════════════════════════════════════════
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
   'Résultats de l''examen de français',
   'Résultats',
   'Les résultats de l''examen de français du 1er trimestre sont publiés. Notes moyennes : 12.3/20.',
   'Résultats examen de français disponibles.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 5 DAY), 1, 1, NOW()),

  (1, 'enseignant', '1', 'Mbeng Patricia', 'parent', '5', 'Tchoupa Isaac', 5,
   'Excursion scolaire',
   'Excursion',
   'Une excursion scolaire au musée est organisée le 30 juillet. Merci de signer le formulaire de consentement.',
   'Excursion scolaire le 30 juillet. Consentement requis.',
   1, '2026-2027', DATE_SUB(NOW(), INTERVAL 7 DAY), 1, 0, NOW());
