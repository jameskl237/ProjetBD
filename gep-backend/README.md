# GEP — API Serveur v1.1

API REST complète pour la gestion d'établissements scolaires (primaire, moyen, secondaire).

## Stack

- **Runtime** : Node.js 22+ (ESM, TypeScript via --experimental-strip-types)
- **Framework** : Express 5
- **DB** : MySQL 8 + Drizzle ORM (mysql2)
- **Auth** : JWT (jsonwebtoken) + bcryptjs
- **Validation** : Zod + drizzle-zod
- **Export** : PDFKit (bulletins de notes + relevés de paiements)

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `PORT` | ✅ | Port HTTP |
| `JWT_SECRET` | ✅ | Clé secrète JWT |
| `GEP_DATABASE_URL` | ✅ | URL MySQL complète OU mot de passe seul |
| `DB_HOST` | si URL partielle | Hôte MySQL |
| `DB_PORT` | si URL partielle | Port MySQL |
| `DB_USER` | si URL partielle | Utilisateur MySQL |
| `DB_NAME` | si URL partielle | Base de données |

**Mode URL complète** : `GEP_DATABASE_URL=mysql://user:pwd@host:port/db`
**Mode mot de passe seul** : `GEP_DATABASE_URL=monMotDePasse` + variables DB_* séparées

## Démarrage

```bash
npm install

# Développement
PORT=8080 JWT_SECRET=secret GEP_DATABASE_URL=mysql://... npm run dev

# Production
npm run build
PORT=8080 JWT_SECRET=secret GEP_DATABASE_URL=mysql://... npm start

# Données de démo
PORT=8080 JWT_SECRET=secret GEP_DATABASE_URL=mysql://... npm run seed
```

## Structure

```
src/
├── index.ts              — Point d'entrée
├── app.ts                — App Express + middlewares
├── seed.ts               — Données de démonstration
├── lib/logger.ts         — Logger Pino
├── middlewares/
│   ├── auth.ts           — Vérification JWT
│   ├── rbac.ts           — Contrôle d'accès par rôle
│   └── validate.ts       — Validation Zod
└── routes/               — 16 fichiers de routes
db/
├── index.ts              — Connexion MySQL (Drizzle)
└── schema/               — 27 tables (drizzle-orm/mysql-core)
```

## RBAC — Rôles

| Rôle | Identifiant | Accès |
|------|-------------|-------|
| Directeur | typeAdmin=1 | Tout |
| Secrétaire | typeAdmin=2 | Lecture + élèves/inscriptions/messages |
| Comptable | typeAdmin=3 | Paiements + consultation |
| Enseignant | typePersonne=1 | Cours, notes, messages |
| Parent | typePersonne=2 | Consultation notes, messagerie |

## Endpoints

### Auth
| Méthode | Route | Rôles |
|---------|-------|-------|
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Authentifié |

### Élèves
| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /api/eleves | Staff |
| POST | /api/eleves | Dir, Sec |
| GET | /api/eleves/:id | Staff |
| PUT | /api/eleves/:id | Dir, Sec |
| DELETE | /api/eleves/:id | Dir |
| GET | /api/eleves/:id/paiements | Dir, Sec, Cpt, Parent |
| GET | /api/eleves/:id/notes | Dir, Sec, Ens, Parent |
| GET | /api/eleves/:id/inscriptions | Dir, Sec, Cpt |

### Paiements
| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /api/paiements | Dir, Sec, Cpt |
| POST | /api/paiements | Dir, Cpt |
| GET | /api/paiements/:id | Dir, Sec, Cpt |
| PUT | /api/paiements/:id | Dir, Cpt |
| DELETE | /api/paiements/:id | Dir |
| GET | /api/paiements/modes/list | Dir, Sec, Cpt |
| POST | /api/paiements/modes | Dir |
| PUT | /api/paiements/modes/:id | Dir |
| DELETE | /api/paiements/modes/:id | Dir |
| GET | /api/paiements/eleve/:matricule | Dir, Sec, Cpt, Parent |
| GET | /api/paiements/export?format=csv\|pdf | Dir, Sec, Cpt |
| GET | /api/paiements/export?format=csv&matricule=X | Dir, Sec, Cpt |

### Évaluations & Bulletins
| Méthode | Route | Rôles |
|---------|-------|-------|
| GET | /api/evaluations | Staff + Parent |
| POST | /api/evaluations | Dir, Ens |
| PUT | /api/evaluations/:id | Dir, Ens |
| DELETE | /api/evaluations/:id | Dir |
| GET | /api/evaluations/sessions | Dir, Sec, Ens |
| POST | /api/evaluations/sessions | Dir, Sec |
| PUT | /api/evaluations/sessions/:id | Dir, Sec |
| DELETE | /api/evaluations/sessions/:id | Dir |
| GET | /api/evaluations/epreuves | Dir, Sec, Ens |
| POST | /api/evaluations/epreuves | Dir, Ens |
| PUT | /api/evaluations/epreuves/:id | Dir, Ens |
| DELETE | /api/evaluations/epreuves/:id | Dir |
| GET | /api/evaluations/natures | Dir, Sec, Ens |
| POST | /api/evaluations/natures | Dir |
| GET | /api/evaluations/bulletin/:matricule | Dir, Sec, Ens, Parent |
| GET | /api/evaluations/bulletin/:matricule/export?format=pdf\|csv | Dir, Sec, Ens, Parent |

### Cours
| Méthode | Route | Rôles |
|---------|-------|-------|
| GET/POST | /api/cours | Staff + Ens |
| GET/PUT/DELETE | /api/cours/:id | Dir/Sec/Ens |
| GET/POST | /api/cours/enseignants | Staff |
| GET/PUT/DELETE | /api/cours/enseignants/:id | Dir |
| GET/POST | /api/cours/emploi-du-temps | Staff |
| PUT/DELETE | /api/cours/emploi-du-temps/:id | Dir, Sec |
| GET/POST | /api/cours/titulaires | Staff |
| GET/PUT/DELETE | /api/cours/titulaires/:id | Dir |

### Années académiques
| Méthode | Route | Rôles |
|---------|-------|-------|
| GET/POST | /api/annees | Dir, Sec, Cpt |
| GET/PUT/DELETE | /api/annees/:id | Dir |
| GET/POST | /api/annees/trimestres | Dir, Sec, Cpt |
| PUT/DELETE | /api/annees/trimestres/:id | Dir |
| GET/POST | /api/annees/inscriptions | Dir, Sec, Cpt |
| GET/PUT/DELETE | /api/annees/inscriptions/:id | Dir, Sec |

### Autres
| Route | Description |
|-------|-------------|
| /api/classes | CRUD classes (avec cycle) |
| /api/salles | CRUD salles |
| /api/scolarite + /cycles + /tranches | Tarifs et cycles |
| /api/parents + /rapports + /disciplines | Liens parent-élève |
| /api/messages | Messagerie + /lire + /valider |
| /api/quartiers + /villes + /residents | Géographie |
| /api/livres + /specialites + /stock | Bibliothèque |
| /api/personnes | Personnel (enseignants & parents) |
| /api/admins | Comptes administrateurs |
| /api/healthz | Health check |

## Comptes démo (après `npm run seed`)

| Rôle | Login | Mot de passe |
|------|-------|--------------|
| Directeur | `directeur` | `Directeur@2024` |
| Secrétaire | `secretaire` | `Secretaire@2024` |
| Comptable | `comptable` | `Comptable@2024` |
| Enseignant | `enseignant` | `Enseignant@2024` |
| Parent | `parent` | `Parent@2024` |
