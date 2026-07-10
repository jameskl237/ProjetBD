# Plan de Validation et de Test Complet — GEP Nebula 🧪

Ce document contient le protocole de test complet pour valider l'intégration du **Frontend (React)**, du **Backend (Express)** et de la **Base de données (MySQL)**. 

L'objectif est de s'assurer que les données ne sont plus uniquement simulées (mock data) mais qu'elles sont correctement lues, écrites et mises à jour en base de données selon les rôles définis (RBAC).

---

## 🛑 Consigne de Sécurité Importante
> [!WARNING]
> Pour ne pas corrompre les données réelles, effectuez ces tests en environnement de développement local. Avant de commencer, assurez-vous que la base de données est lancée dans son état initial (seul le script `npm run seed` doit être appliqué).

---

## 1. Phase Technique : Connexion et Intégration 🔌

Cette phase permet de valider que la tuyauterie de l'application fonctionne (Frontend ↔ Backend ↔ Base de données).

- [ ] **Validation de l'API Healthcheck** :
  - Ouvrir un navigateur sur `http://localhost:8080/api/healthz` et vérifier le statut `{"status":"ok"}`.
- [ ] **Validation du Proxy Vite (Frontend)** :
  - Lancer la console développeur du navigateur (F12) sur `http://localhost:5173/login`.
  - Effectuer une tentative de connexion erronée et vérifier dans l'onglet **Network (Réseau)** que l'appel part bien vers `http://localhost:5173/api/auth/login` (et non `localhost:8080`) et renvoie une erreur `401`.
- [ ] **Persistance LocalStorage** :
  - Se connecter avec un compte valide. Rafraîchir la page (F5) et vérifier que la session reste active (le token JWT doit être stocké en `localStorage`).

---

## 2. Phase RBAC : Rôles et Autorisations 🔑

Tester que les droits d'accès sont respectés. Chaque rôle ne doit voir et pouvoir modifier que ce qui lui est légalement attribué.

| Rôle | Identifiant | Mot de passe | Ce qu'il DOIT pouvoir faire | Ce qu'il NE DOIT PAS pouvoir faire |
| :--- | :--- | :--- | :--- | :--- |
| **Directeur** | `directeur` | `Directeur@2024` | Tout (classes, finances, configuration, suppression d'élèves, etc.) | Rien |
| **Secrétaire** | `secretaire` | `Secretaire@2024` | Inscriptions, consultation élèves, gestion transport, messagerie | Modifier la scolarité globale, supprimer des élèves |
| **Comptable** | `comptable` | `Comptable@2024` | Suivi et saisie des paiements, facturation, impayés | Modifier les notes, inscrire de nouveaux élèves |
| **Enseignant** | `enseignant` | `Enseignant@2024` | Saisie des notes de sa matière, emploi du temps | Voir les paiements des élèves, modifier les structures de classes |
| **Parent** | `parent` | `Parent@2024` | Consulter les notes de son enfant, voir ses reçus de paiement, messagerie | Modifier les notes, saisir des paiements |

### Protocole de test de cloisonnement :
- [ ] Se connecter en tant que **Secrétaire** :
  - Tenter d'accéder manuellement à l'URL `http://localhost:5173/paiements` (Comptabilité) ou `http://localhost:5173/admin/parametres`.
  - Vérifier que l'application redirige vers le tableau de bord ou affiche un message d'erreur d'autorisation.
- [ ] Se connecter en tant que **Enseignant** :
  - Tenter d'accéder à `http://localhost:5173/eleves` (Inscriptions).
  - S'assurer que les boutons d'actions financières ne sont pas rendus sur son interface.

---

## 3. Phase Fonctionnelle : Validation par Module 📦

### 3.1 Module Élèves & Inscriptions (Rôles : Directeur, Secrétaire)
- [ ] **Création d'un nouvel élève** :
  - Remplir le formulaire d'inscription (Nom, Prénom, Date de naissance, Cycle, Quartier).
  - Soumettre et vérifier que l'élève apparaît en temps réel dans la liste globale.
  - *Vérification BD* : Lancer une requête `SELECT * FROM Eleve WHERE nom = '...'` pour confirmer l'insertion en base.
- [ ] **Affectation à un Parent** :
  - Associer le nouvel élève à un parent existant dans la base.
  - Se connecter avec le compte de ce Parent et vérifier que l'élève apparaît sur son tableau de bord.
- [ ] **Clôture / Radiation** :
  - Archiver ou clôturer l'inscription d'un élève.
  - S'assurer qu'il n'est plus listé parmi les élèves actifs.

### 3.2 Module Classes & Enseignements (Rôles : Directeur, Secrétaire)
- [ ] **Création de classe** :
  - Créer une classe (ex: `CM1-A`) associée à une salle de classe et à un cycle tarifaire.
- [ ] **Affectation d'élèves** :
  - Associer plusieurs élèves à cette classe.
  - Confirmer que leur scolarité et tranches financières sont générées (calculées en fonction du cycle tarifaire de la classe).
- [ ] **Affectation Enseignant Titulaire** :
  - Assigner un enseignant à la classe et lui attribuer une matière.
  - Se connecter avec le compte de cet enseignant et vérifier que la classe `CM1-A` apparaît dans sa liste des classes gérées.

### 3.3 Module Comptabilité & Paiements (Rôles : Directeur, Comptable)
- [ ] **Saisie de paiement** :
  - Sélectionner un élève ayant des tranches impayées.
  - Enregistrer un paiement (ex: Tranche 1 - Scolarité, montant `50 000 FCFA`, mode `Espèces` ou `Chèque`).
  - Vérifier que le statut de la tranche passe de `Impayé` à `Payé` (ou `Partiellement payé` si montant insuffisant).
- [ ] **Génération de Facture / Reçu** :
  - Cliquer sur le bouton d'impression ou d'exportation de la facture de ce paiement.
  - Confirmer que le PDF s'ouvre, affiche les informations correctes (Nom élève, Classe, Montant payé, Reste à payer).
- [ ] **Liste des Impayés** :
  - Consulter l'onglet "Impayés".
  - Vérifier que la liste affiche la somme globale due par les élèves en retard de paiement.

### 3.4 Module Évaluations & Bulletins (Rôles : Enseignant, Directeur)
- [ ] **Saisie des Notes** :
  - En tant qu'**Enseignant**, sélectionner sa classe et sa matière.
  - Renseigner les notes d'une évaluation pour tous les élèves de la classe.
  - Enregistrer et s'assurer que les notes sont bien sauvegardées en base de données.
- [ ] **Calcul des Moyennes** :
  - Vérifier que la moyenne de la classe et le classement des élèves se mettent à jour automatiquement.
- [ ] **Impression du Bulletin** :
  - En tant que **Directeur** ou **Parent**, exporter le bulletin trimestriel de l'élève en PDF.
  - S'assurer que le fichier PDF généré contient toutes les matières, les moyennes respectives, la moyenne générale, et les appréciations saisies par les enseignants.

### 3.5 Module Discipline (Rôles : Enseignant, Directeur, Secrétaire)
- [ ] **Signalement d'incident** :
  - Saisir un incident disciplinaire pour un élève (type, date, description).
- [ ] **Application d'une Sanction** :
  - Assigner une sanction (Heures de colle, Avertissement, Exclusion) à l'élève.
  - Vérifier que la sanction apparaît dans le dossier de l'élève sur la fiche complète.

### 3.6 Module Transport Scolaire (Rôles : Secrétaire, Comptable)
- [ ] **Abonnement à une ligne de bus** :
  - Assigner un itinéraire de transport à un élève.
- [ ] **Facturation du transport** :
  - Vérifier que les frais de transport s'ajoutent aux obligations financières de l'élève et apparaissent dans le tableau de bord des paiements.

---

## 4. Phase de Validation Technique des Données (Base de Données) 🗄️

Lors des opérations d'écriture du Frontend, il est nécessaire de valider que la base de données enregistre les données de manière intègre :

*   **Vérification des Contraintes d'Intégrité** :
    *   Tenter d'inscrire un élève avec un matricule déjà existant (le backend doit rejeter la requête proprement et le frontend doit afficher un message d'alerte).
*   **Vérification des transactions financières** :
    *   S'assurer que la somme totale payée enregistrée dans la table `Paiement` correspond exactement à la somme déduite du solde restant de l'élève.
