// Reflète exactement l'arbre de routes du backend (gep-backend/src/routes/index.ts).
// Toute évolution du contrat backend doit être répercutée ici en premier.
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  admins: '/admins',
  dashboard: { stats: '/dashboard/stats' },
  eleves: '/eleves',
  classes: '/classes',
  salles: '/salles',
  annees: {
    root: '/annees',
    trimestres: '/annees/trimestres',
    inscriptions: '/annees/inscriptions',
  },
  cours: {
    root: '/cours',
    enseignants: '/cours/enseignants',
    emploiDuTemps: '/cours/emploi-du-temps',
    titulaires: '/cours/titulaires',
    enseignantDashboard: '/cours/enseignant/dashboard',
  },
  evaluations: {
    root: '/evaluations',
    sessions: '/evaluations/sessions',
    epreuves: '/evaluations/epreuves',
    natures: '/evaluations/natures',
    bulletin: (matricule) => `/evaluations/bulletin/${matricule}`,
    bulletinExport: (matricule) => `/evaluations/bulletin/${matricule}/export`,
  },
  scolarite: {
    root: '/scolarite',
    cycles: '/scolarite/cycles',
    classes: '/scolarite/classes',
    tranches: '/scolarite/tranches',
  },
  paiements: {
    root: '/paiements',
    modes: '/paiements/modes/list',
    modesBase: '/paiements/modes',
    export: '/paiements/export',
    impayes: '/paiements/impayes',
    statut: (matricule) => `/paiements/statut/${matricule}`,
    parEleve: (matricule) => `/paiements/eleve/${matricule}`,
    recu: (id) => `/paiements/${id}/recu`,
  },
  parents: {
    root: '/parents',
    rapports: '/parents/rapports',
    disciplines: '/parents/disciplines',
  },
  messages: '/messages',
  quartiers: {
    root: '/quartiers',
    villes: '/quartiers/villes',
    residents: '/quartiers/residents',
  },
  livres: {
    root: '/livres',
    specialites: '/livres/specialites',
    stock: '/livres/stock',
  },
  personnes: {
    root: '/personnes',
    me: '/personnes/me',
  },
  absences: '/absences',
  transport: { abonnements: '/transport/abonnements' },
  bulletins: '/bulletins',
  appreciations: '/appreciations',
}
