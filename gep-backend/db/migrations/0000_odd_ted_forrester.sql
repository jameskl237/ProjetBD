CREATE TABLE `Admin` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`login` varchar(100) NOT NULL,
	`username` varchar(100),
	`password` varchar(255) NOT NULL,
	`typeAdmin` tinyint NOT NULL,
	`actif` tinyint NOT NULL DEFAULT 1,
	`isDelete` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime,
	`updatedAt` datetime,
	`langue` varchar(10) NOT NULL DEFAULT 'fr',
	CONSTRAINT `Admin_ID` PRIMARY KEY(`ID`),
	CONSTRAINT `Admin_login_unique` UNIQUE(`login`)
);
--> statement-breakpoint
CREATE TABLE `Personne` (
	`idPers` int AUTO_INCREMENT NOT NULL,
	`typePersonne` tinyint NOT NULL,
	`password` varchar(255) NOT NULL,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	`sexe` smallint DEFAULT 0,
	`photoURL` varchar(255),
	`email` varchar(255),
	`login` varchar(100),
	`actif` tinyint NOT NULL DEFAULT 1,
	`createdAt` datetime,
	`updatedAt` datetime,
	`langue` varchar(10) NOT NULL DEFAULT 'fr',
	`nom` varchar(60),
	`prenom` varchar(60),
	`mobile` varchar(20),
	`phone` varchar(20),
	`username` varchar(100),
	`dateNaissance` date,
	`lieuNaissance` varchar(60),
	CONSTRAINT `Personne_idPers` PRIMARY KEY(`idPers`),
	CONSTRAINT `Personne_login_unique` UNIQUE(`login`)
);
--> statement-breakpoint
CREATE TABLE `VilleNaissance` (
	`idVille` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(100) NOT NULL,
	`actif` tinyint NOT NULL DEFAULT 1,
	CONSTRAINT `VilleNaissance_idVille` PRIMARY KEY(`idVille`),
	CONSTRAINT `VilleNaissance_libelle_unique` UNIQUE(`libelle`)
);
--> statement-breakpoint
CREATE TABLE `Eleve` (
	`matricule` int AUTO_INCREMENT NOT NULL,
	`matriculeCode` varchar(20),
	`nom` varchar(60) NOT NULL,
	`prenom` varchar(60) NOT NULL,
	`dateNaissance` date NOT NULL,
	`lieuNaissance` varchar(30) NOT NULL,
	`sexe` smallint NOT NULL DEFAULT 0,
	`langue` varchar(30) NOT NULL DEFAULT 'NON DEFINI',
	`photoURL` varchar(512),
	`actif` tinyint NOT NULL DEFAULT 0,
	`idVilleNaissance` int NOT NULL,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Eleve_matricule` PRIMARY KEY(`matricule`)
);
--> statement-breakpoint
CREATE TABLE `Quartier` (
	`idQuartier` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(100) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	CONSTRAINT `Quartier_idQuartier` PRIMARY KEY(`idQuartier`)
);
--> statement-breakpoint
CREATE TABLE `Residents` (
	`idResi` int AUTO_INCREMENT NOT NULL,
	`idPers` int NOT NULL,
	`idQuartier` int NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Residents_idResi` PRIMARY KEY(`idResi`)
);
--> statement-breakpoint
CREATE TABLE `Cycle` (
	`idCycle` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`idAdmin` int NOT NULL,
	`created` datetime NOT NULL,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Cycle_idCycle` PRIMARY KEY(`idCycle`)
);
--> statement-breakpoint
CREATE TABLE `Classe` (
	`idClasse` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(100) NOT NULL DEFAULT 'INDEFINI',
	`idCycle` int NOT NULL,
	`titulaire` int,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Classe_idClasse` PRIMARY KEY(`idClasse`)
);
--> statement-breakpoint
CREATE TABLE `Salle` (
	`idSalle` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(30) NOT NULL,
	`position` varchar(100) NOT NULL DEFAULT '',
	`surface` varchar(30) NOT NULL DEFAULT '',
	`idClasse` int,
	`actif` tinyint NOT NULL DEFAULT 1,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`capacite` int,
	CONSTRAINT `Salle_idSalle` PRIMARY KEY(`idSalle`)
);
--> statement-breakpoint
CREATE TABLE `AnneeAcademique` (
	`idAnnee` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(200) NOT NULL,
	`periode` varchar(255) NOT NULL DEFAULT '',
	`created_at` date NOT NULL,
	`idAdmin` int NOT NULL,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `AnneeAcademique_idAnnee` PRIMARY KEY(`idAnnee`)
);
--> statement-breakpoint
CREATE TABLE `Trimestre` (
	`idTrimes` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`periode` varchar(255) NOT NULL DEFAULT '',
	`idAca` int NOT NULL,
	`idAdmin` int NOT NULL,
	CONSTRAINT `Trimestre_idTrimes` PRIMARY KEY(`idTrimes`)
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`idSession` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`description` varchar(255),
	`idTrimestre` int NOT NULL,
	`idPers` int NOT NULL,
	`date_passage` date,
	`created_at` datetime,
	CONSTRAINT `Session_idSession` PRIMARY KEY(`idSession`)
);
--> statement-breakpoint
CREATE TABLE `Cours` (
	`idCours` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`coefficient` float NOT NULL DEFAULT 1,
	`description` text NOT NULL,
	`idClasse` int NOT NULL,
	`actif` tinyint NOT NULL DEFAULT 1,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	`note` float,
	`idEnseignant` int,
	`heures` int,
	`idSalle` int,
	CONSTRAINT `Cours_idCours` PRIMARY KEY(`idCours`)
);
--> statement-breakpoint
CREATE TABLE `NatureEpreuve` (
	`idNature` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`description` varchar(255),
	`idAnnee` int,
	CONSTRAINT `NatureEpreuve_idNature` PRIMARY KEY(`idNature`)
);
--> statement-breakpoint
CREATE TABLE `Epreuve` (
	`idEpreuve` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`urlDoc` varchar(255) NOT NULL DEFAULT '',
	`auteur` varchar(255) NOT NULL DEFAULT '',
	`idNature` int NOT NULL,
	`idPers` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Epreuve_idEpreuve` PRIMARY KEY(`idEpreuve`)
);
--> statement-breakpoint
CREATE TABLE `Enseignant` (
	`idEnseignant` int AUTO_INCREMENT NOT NULL,
	`idPers` int NOT NULL,
	`idCours` int NOT NULL,
	`Actif` tinyint NOT NULL DEFAULT 1,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	`photoURL` varchar(512),
	CONSTRAINT `Enseignant_idEnseignant` PRIMARY KEY(`idEnseignant`)
);
--> statement-breakpoint
CREATE TABLE `EmploiDuTemps` (
	`idTemps` int AUTO_INCREMENT NOT NULL,
	`jour` varchar(30) NOT NULL,
	`heure` varchar(6) NOT NULL,
	`idClasse` int NOT NULL,
	`idCours` int NOT NULL,
	`idSalle` int,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `EmploiDuTemps_idTemps` PRIMARY KEY(`idTemps`)
);
--> statement-breakpoint
CREATE TABLE `Titulaire` (
	`idTitulaire` int AUTO_INCREMENT NOT NULL,
	`idPers` int NOT NULL,
	`idSalle` int NOT NULL,
	`actif` tinyint NOT NULL DEFAULT 1,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Titulaire_idTitulaire` PRIMARY KEY(`idTitulaire`)
);
--> statement-breakpoint
CREATE TABLE `Frequente` (
	`idFrequente` int AUTO_INCREMENT NOT NULL,
	`idSalle` int NOT NULL,
	`idAcademi` int NOT NULL,
	`matricule` int NOT NULL,
	`commentaire` varchar(255) NOT NULL DEFAULT '',
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Frequente_idFrequente` PRIMARY KEY(`idFrequente`)
);
--> statement-breakpoint
CREATE TABLE `Evaluation` (
	`idEval` int AUTO_INCREMENT NOT NULL,
	`note` float NOT NULL DEFAULT 0,
	`appreciation` varchar(255) NOT NULL DEFAULT '',
	`matricule` int NOT NULL,
	`idEpreuve` int NOT NULL,
	`idCours` int NOT NULL,
	`idSession` int NOT NULL,
	`idPers` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Evaluation_idEval` PRIMARY KEY(`idEval`)
);
--> statement-breakpoint
CREATE TABLE `Discipline` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	CONSTRAINT `Discipline_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `Rapport` (
	`idRap` int AUTO_INCREMENT NOT NULL,
	`matricule` int NOT NULL,
	`idAca` int NOT NULL,
	`commentaire` text NOT NULL,
	`event_date` date NOT NULL,
	`idPers` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	`idDiscipline` int,
	CONSTRAINT `Rapport_idRap` PRIMARY KEY(`idRap`)
);
--> statement-breakpoint
CREATE TABLE `Scolarite` (
	`idScolarite` int AUTO_INCREMENT NOT NULL,
	`inscription` float NOT NULL,
	`pension` float NOT NULL,
	`nbreTranche` int NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`idCycle` int NOT NULL,
	`idFondateur` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Scolarite_idScolarite` PRIMARY KEY(`idScolarite`)
);
--> statement-breakpoint
CREATE TABLE `Tranches` (
	`idTranche` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`montant` float NOT NULL,
	`idScolarite` int NOT NULL,
	`idTrimestre` int NOT NULL,
	`actif` tinyint NOT NULL DEFAULT 1,
	`idFondateur` int NOT NULL,
	CONSTRAINT `Tranches_idTranche` PRIMARY KEY(`idTranche`),
	CONSTRAINT `tranche_scolarite_trimestre_unique` UNIQUE(`idScolarite`,`idTrimestre`)
);
--> statement-breakpoint
CREATE TABLE `Mode` (
	`idMode` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(100) NOT NULL,
	`information` varchar(255) NOT NULL DEFAULT '',
	`actif` tinyint NOT NULL DEFAULT 1,
	`idFondateur` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Mode_idMode` PRIMARY KEY(`idMode`)
);
--> statement-breakpoint
CREATE TABLE `Paiement` (
	`idPaie` int AUTO_INCREMENT NOT NULL,
	`matricule` int NOT NULL,
	`idAca` int NOT NULL,
	`montant` float NOT NULL,
	`url` varchar(255) NOT NULL DEFAULT '',
	`comentaire` varchar(255) NOT NULL DEFAULT '',
	`idMode` int NOT NULL,
	`idTranche` int,
	`operation_ID` varchar(30) NOT NULL DEFAULT '',
	`idPers` int NOT NULL,
	`datePaie` date NOT NULL,
	`dateEnregistrer` datetime NOT NULL,
	CONSTRAINT `Paiement_idPaie` PRIMARY KEY(`idPaie`)
);
--> statement-breakpoint
CREATE TABLE `Parents` (
	`idParent` int AUTO_INCREMENT NOT NULL,
	`idPers` int NOT NULL,
	`matricule` int NOT NULL,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Parents_idParent` PRIMARY KEY(`idParent`)
);
--> statement-breakpoint
CREATE TABLE `Messages` (
	`idMessages` int AUTO_INCREMENT NOT NULL,
	`idExp_Pers` int NOT NULL,
	`senderRole` varchar(30),
	`senderId` varchar(120),
	`senderLabel` varchar(160),
	`receiverRole` varchar(30),
	`receiverId` varchar(120),
	`receiverLabel` varchar(160),
	`idParent` int,
	`recipientPersId` int,
	`objet` varchar(255) NOT NULL DEFAULT '',
	`subject` varchar(255) NOT NULL DEFAULT '',
	`content` text,
	`information` text NOT NULL,
	`type_message` smallint NOT NULL DEFAULT 1,
	`AnneeAcade` varchar(15) NOT NULL DEFAULT '',
	`created_at` datetime,
	`valider` tinyint NOT NULL DEFAULT 0,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`readAt` datetime,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `Messages_idMessages` PRIMARY KEY(`idMessages`)
);
--> statement-breakpoint
CREATE TABLE `Specialite` (
	`idSpecialite` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`idAdmin` int NOT NULL,
	CONSTRAINT `Specialite_idSpecialite` PRIMARY KEY(`idSpecialite`)
);
--> statement-breakpoint
CREATE TABLE `livre` (
	`idLivre` int AUTO_INCREMENT NOT NULL,
	`titre` varchar(255) NOT NULL,
	`auteurs` varchar(255),
	`prix` float,
	`idSpecialite` int,
	`edition` varchar(255),
	`annee_parution` date,
	`idAdmin` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `livre_idLivre` PRIMARY KEY(`idLivre`)
);
--> statement-breakpoint
CREATE TABLE `Livres` (
	`idLivre` int AUTO_INCREMENT NOT NULL,
	`titre` varchar(255) NOT NULL,
	`auteurs` varchar(255) NOT NULL DEFAULT '',
	`prix` float NOT NULL DEFAULT 0,
	`idSpecialite` int NOT NULL,
	`edition` varchar(255) NOT NULL DEFAULT '',
	`annee_parution` date,
	`totalCopie` smallint NOT NULL DEFAULT 0,
	`idAdmin` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `Livres_idLivre` PRIMARY KEY(`idLivre`)
);
--> statement-breakpoint
CREATE TABLE `Absence` (
	`idAbsence` int AUTO_INCREMENT NOT NULL,
	`matricule` int NOT NULL,
	`idCours` int NOT NULL,
	`date` date NOT NULL,
	`justifiee` tinyint NOT NULL DEFAULT 0,
	`commentaire` varchar(255) NOT NULL DEFAULT '',
	`idPers` int NOT NULL,
	`idAca` int NOT NULL,
	`created_at` datetime,
	`isDelete` tinyint DEFAULT 0,
	CONSTRAINT `Absence_idAbsence` PRIMARY KEY(`idAbsence`)
);
--> statement-breakpoint
CREATE TABLE `Abonnement` (
	`idAbonnement` int AUTO_INCREMENT NOT NULL,
	`matricule` int NOT NULL,
	`type` tinyint NOT NULL DEFAULT 0,
	`dateDebut` date NOT NULL,
	`dateFin` date,
	`actif` tinyint NOT NULL DEFAULT 1,
	`idAdmin` int NOT NULL,
	`created_at` datetime,
	CONSTRAINT `Abonnement_idAbonnement` PRIMARY KEY(`idAbonnement`)
);
--> statement-breakpoint
CREATE TABLE `Bulletin` (
	`idBulletin` int AUTO_INCREMENT NOT NULL,
	`libelle` varchar(255) NOT NULL,
	`etat` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime,
	CONSTRAINT `Bulletin_idBulletin` PRIMARY KEY(`idBulletin`)
);
--> statement-breakpoint
CREATE TABLE `Appreciation` (
	`idAppreciation` int AUTO_INCREMENT NOT NULL,
	`grade` varchar(10) NOT NULL,
	`libelleFr` varchar(100) NOT NULL,
	`libelleEn` varchar(100) NOT NULL,
	`descriptionFr` varchar(255),
	`descriptionEn` varchar(255),
	`noteMin` int NOT NULL,
	`noteMax` int NOT NULL,
	`ordre` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `Appreciation_idAppreciation` PRIMARY KEY(`idAppreciation`)
);
