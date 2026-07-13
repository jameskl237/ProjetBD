-- ============================================================
-- SCRIPT : Insertion d'absences pour les enfants d'Ekotto Andre
-- Ce script trouve automatiquement les enfants d'Ekotto Andre
-- via la table Parents, puis insère des absences réalistes.
-- ============================================================

-- ── 1. Trouver l'idPers d'Ekotto Andre ──────────────────────
SET @ekotto_idPers = (SELECT idPers FROM Personne WHERE login = 'ekotto' AND typePersonne = 2 LIMIT 1);

-- ── 2. Trouver les matricules de ses enfants ────────────────
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_enfants_ekotto (
  matricule INT PRIMARY KEY
);
DELETE FROM tmp_enfants_ekotto;
INSERT INTO tmp_enfants_ekotto (matricule)
  SELECT matricule FROM Parents WHERE idPers = @ekotto_idPers AND isDelete = 0;

-- ── 3. Trouver l'année académique active (la plus récente) ──
SET @idAca = (SELECT idAnnee FROM AnneeAcademique WHERE isDelete = 0 ORDER BY idAnnee DESC LIMIT 1);

-- ── 4. Trouver les cours et enseignants liés aux enfants ────
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_cours_enfants (
  matricule INT,
  idCours INT,
  idEnseignant INT,
  nom_enfant VARCHAR(120),
  nom_cours VARCHAR(100),
  nom_enseignant VARCHAR(120),
  PRIMARY KEY (matricule, idCours)
);
DELETE FROM tmp_cours_enfants;
INSERT INTO tmp_cours_enfants (matricule, idCours, idEnseignant, nom_enfant, nom_cours, nom_enseignant)
  SELECT
    f.matricule,
    c.idCours,
    e.idPers AS idEnseignant,
    CONCAT(el.nom, ' ', el.prenom) AS nom_enfant,
    c.libelle AS nom_cours,
    CONCAT(p.nom, ' ', p.prenom) AS nom_enseignant
  FROM Frequente f
  INNER JOIN Salle s ON f.idSalle = s.idSalle
  INNER JOIN Classe cl ON s.idClasse = cl.idClasse
  INNER JOIN Cours c ON c.idClasse = cl.idClasse
  INNER JOIN Enseignant e ON e.idCours = c.idCours AND e.isDelete = 0
  INNER JOIN Personne p ON e.idPers = p.idPers
  INNER JOIN Eleve el ON f.matricule = el.matricule
  WHERE f.matricule IN (SELECT matricule FROM tmp_enfants_ekotto)
    AND c.actif = 1;

-- ── 5. Vérification ────────────────────────────────────────
SELECT 'Enfants trouvés :' AS info;
SELECT te.matricule, e.nom, e.prenom
FROM tmp_enfants_ekotto te
INNER JOIN Eleve e ON te.matricule = e.matricule;

SELECT 'Cours disponibles pour ces enfants :' AS info;
SELECT * FROM tmp_cours_enfants;

-- ── 6. Insertion des absences ──────────────────────────────
-- Absences pour le 1er trimestre (septembre-octobre 2026)
INSERT INTO Absence (matricule, idCours, date, justifiee, commentaire, idPers, idAca, created_at, isDelete)
SELECT
  tce.matricule,
  tce.idCours,
  dates.date_abs,
  CASE WHEN RAND() < 0.4 THEN 1 ELSE 0 END AS justifiee,
  CASE FLOOR(RAND() * 6)
    WHEN 0 THEN 'Absence non justifiée'
    WHEN 1 THEN 'Raison médicale'
    WHEN 2 THEN 'Retard important - arrivée après la 2ème heure'
    WHEN 3 THEN 'Convocation familiale'
    WHEN 4 THEN 'Problème de transport'
    WHEN 5 THEN 'Maladie - certificat médical fourni'
  END AS commentaire,
  tce.idEnseignant AS idPers,
  @idAca AS idAca,
  NOW() AS created_at,
  0 AS isDelete
FROM tmp_cours_enfants tce
CROSS JOIN (
  SELECT '2026-09-08' AS date_abs UNION ALL
  SELECT '2026-09-15' UNION ALL
  SELECT '2026-09-22' UNION ALL
  SELECT '2026-10-06' UNION ALL
  SELECT '2026-10-13' UNION ALL
  SELECT '2026-10-20' UNION ALL
  SELECT '2026-10-27' UNION ALL
  SELECT '2026-11-03' UNION ALL
  SELECT '2026-11-10' UNION ALL
  SELECT '2026-11-17'
) dates
-- Éviter les doublons si le script est exécuté plusieurs fois
WHERE NOT EXISTS (
  SELECT 1 FROM Absence a
  WHERE a.matricule = tce.matricule
    AND a.idCours = tce.idCours
    AND a.date = dates.date_abs
    AND a.isDelete = 0
)
-- Limiter à ~8 absences par enfant (10 dates × N cours peut être trop)
AND RAND() < 0.25;

-- ── 7. Résultat ────────────────────────────────────────────
SELECT
  a.idAbsence,
  CONCAT(e.nom, ' ', e.prenom) AS Enfant,
  c.libelle AS Cours,
  a.date AS Date,
  CASE a.justifiee WHEN 1 THEN 'Justifiée' ELSE 'Non justifiée' END AS Statut,
  a.commentaire,
  CONCAT(p.nom, ' ', p.prenom) AS Enseignant
FROM Absence a
INNER JOIN Eleve e ON a.matricule = e.matricule
INNER JOIN Cours c ON a.idCours = c.idCours
INNER JOIN Personne p ON a.idPers = p.idPers
WHERE a.matricule IN (SELECT matricule FROM tmp_enfants_ekotto)
  AND a.isDelete = 0
ORDER BY e.nom, a.date;

-- ── 8. Nettoyage ──────────────────────────────────────────
DROP TEMPORARY TABLE IF EXISTS tmp_enfants_ekotto;
DROP TEMPORARY TABLE IF EXISTS tmp_cours_enfants;

SELECT CONCAT('Terminé ! Absences créées pour les enfants d''Ekotto Andre (idPers=', @ekotto_idPers, ', idAca=', @idAca, ')') AS Resultat;
