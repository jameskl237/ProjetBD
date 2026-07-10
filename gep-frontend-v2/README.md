# GEP Nebular — Frontend (v2)

Frontend React (Vite) refondu pour l'application de gestion d'établissement **GEP**.
Cette version corrige les anomalies structurelles du frontend précédent et respecte
strictement le contrat exposé par le backend Express (`gep-backend`).

## Ce qui a changé par rapport à l'ancienne version

- **Une seule Sidebar réutilisable** (`src/components/layout/Sidebar.jsx`), pilotée
  par un unique fichier de configuration de navigation basé sur les rôles
  (`src/config/navigation.js`). L'ancien frontend recréait une barre latérale (ou un
  sous-menu complet) dans chaque module — `AdminSidebar`, `Module35Layout`,
  `NotesLayout`, `DisciplineLayout`, etc. — ce qui dupliquait la navigation et
  désynchronisait facilement les menus entre eux.
- **Un seul arbre de routes** (`src/App.jsx` + `src/components/layout/AppLayout.jsx`) :
  toute page authentifiée est rendue à l'intérieur d'un unique layout (Sidebar +
  contenu), au lieu d'avoir un routeur par module remontant sa propre mise en page.
- **Une couche API alignée sur le contrat réel du backend** (`src/api/`) : chaque
  endpoint appelé correspond exactement à une route Express existante
  (`gep-backend/src/routes/*.ts`), avec les mêmes noms de champs, la même
  pagination/scoping, et les mêmes restrictions de rôle (RBAC). Voir
  `src/api/endpoints.js` pour la carte complète des routes.
- **Authentification conforme** : `AuthContext` utilise `POST /auth/login` et
  `GET /auth/me` tels qu'implémentés côté serveur (JWT, `type`/`typeAdmin`/`typePersonne`),
  et le rôle applicatif (`administrateur`, `comptable`, `enseignant`, `parent`) est
  dérivé exactement comme le fait `middlewares/rbac.ts` côté backend.
- **Composants génériques réutilisables** (`Table`, `Modal`, `SimpleCrudPage`, hooks
  `useResource`/`useAuth`) pour éviter de dupliquer la mécanique liste/formulaire sur
  chaque ressource de référence (villes, quartiers, spécialités, cycles, modes de
  paiement, etc.).

## Charte graphique

Les couleurs, polices et l'identité "GEP Nebular" (violet profond `#4C1D95` /
cyan `#06B6D4`, police Plus Jakarta Sans + DM Sans) sont reprises du frontend
existant (`src/index.css`), afin de conserver une continuité visuelle avec
l'application actuelle.

## Configuration

```bash
cp .env.example .env   # ajuster VITE_API_URL si besoin
npm install
npm run dev
```

Le backend Express est attendu sur `http://localhost:8080/api` par défaut
(voir `gep-backend/.env` → `PORT=8080`, toutes les routes montées sous `/api`).

## Rôles applicatifs

Le backend expose 4 rôles logiques (voir `middlewares/rbac.ts`) :

| Rôle            | Origine JWT                          | Page d'accueil          |
|------------------|---------------------------------------|--------------------------|
| Administrateur   | `type: "admin"`, `typeAdmin` 1 ou 2   | `/dashboard`             |
| Comptable        | `type: "admin"`, `typeAdmin === 3`    | `/paiements`             |
| Enseignant       | `type: "personne"`, `typePersonne === 1` | `/enseignant`         |
| Parent           | `type: "personne"`, `typePersonne === 2` | `/parent`             |

Certaines actions (gestion des comptes `Personne`, des comptes `Admin`, de la
grille de scolarité) restent réservées au **directeur** (`typeAdmin === 1`),
conformément à `requireDirecteur` côté backend — l'interface l'indique et
désactive l'écriture pour les autres profils.

## Structure

```
src/
  api/            # client axios + un module par ressource backend
  components/
    layout/       # Sidebar, Topbar, AppLayout, PageHeader (uniques, partagés)
    ui/           # Table, Modal, Card, Badge, StatCard, Alert, Spinner…
    forms/        # InputField, SelectField, FormError
    crud/         # SimpleCrudPage : CRUD générique déclaratif
  config/         # navigation.js — source unique de vérité rôles/menu
  context/        # AuthContext
  hooks/          # useAuth, useResource
  pages/          # une page par écran, regroupée par domaine métier
  routes/         # ProtectedRoute
```

Ce paquet ne contient que le frontend : le backend n'est pas inclus et doit
tourner séparément (voir le dépôt `gep-backend`).
