// Source unique de vérité pour les rôles et la navigation.
// Reprend exactement le RBAC du backend (middlewares/rbac.ts::getRole) pour
// qu'un seul et même composant Sidebar puisse servir tous les rôles.
export const ROLES = {
  ADMINISTRATEUR: 'administrateur',
  COMPTABLE: 'comptable',
  ENSEIGNANT: 'enseignant',
  PARENT: 'parent',
}

export const ROLE_LABELS = {
  [ROLES.ADMINISTRATEUR]: 'Administrateur',
  [ROLES.COMPTABLE]: 'Comptable',
  [ROLES.ENSEIGNANT]: 'Enseignant',
  [ROLES.PARENT]: 'Parent',
}

// Le backend renvoie un libellé "role" au login, mais /auth/me (rechargement)
// ne renvoie que type/typeAdmin/typePersonne : on retombe dessus si absent.
export function getRoleKey(user) {
  if (!user) return null
  if (user.type === 'admin') {
    return user.typeAdmin === 3 ? ROLES.COMPTABLE : ROLES.ADMINISTRATEUR
  }
  if (user.type === 'personne') {
    return user.typePersonne === 1 ? ROLES.ENSEIGNANT : ROLES.PARENT
  }
  const label = (user.role || '').toLowerCase()
  if (label.includes('comptable')) return ROLES.COMPTABLE
  if (label.includes('enseignant')) return ROLES.ENSEIGNANT
  if (label.includes('parent')) return ROLES.PARENT
  if (label.includes('directeur') || label.includes('secr')) return ROLES.ADMINISTRATEUR
  return null
}

export function isDirecteur(user) {
  return user?.type === 'admin' && user?.typeAdmin === 1
}

export function getDashboardPath(roleKey) {
  switch (roleKey) {
    case ROLES.COMPTABLE: return '/paiements'
    case ROLES.ENSEIGNANT: return '/enseignant'
    case ROLES.PARENT: return '/parent'
    default: return '/dashboard'
  }
}

// Liste unique des sections, utilisée par la Sidebar réutilisable pour
// construire un menu propre à chaque rôle sans jamais dupliquer de code.
export const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/paiements', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.COMPTABLE] },
  { to: '/enseignant', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.ENSEIGNANT] },
  { to: '/enseignant/cours', icon: '📖', label: 'Mes cours', roles: [ROLES.ENSEIGNANT] },
  { to: '/enseignant/eleves', icon: '👦', label: 'Mes élèves', roles: [ROLES.ENSEIGNANT] },
  { to: '/parent', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.PARENT] },

  { to: '/eleves', icon: '👦', label: 'Élèves', roles: [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE] },
  { to: '/inscriptions', icon: '📋', label: 'Inscriptions', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/annees', icon: '🗓️', label: 'Années académiques', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/classes', icon: '🏫', label: 'Classes', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/salles', icon: '🚪', label: 'Salles', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/cours', icon: '📖', label: 'Cours / Matières', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/enseignants', icon: '🎓', label: 'Enseignants', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/parents', icon: '👨‍👩‍👧', label: 'Parents', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/personnes', icon: '👥', label: 'Comptes (Personnes)', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/paiements', icon: '💳', label: 'Paiements', roles: [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE] },
  { to: '/paiements/modes', icon: '🏦', label: 'Modes de paiement', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/scolarite', icon: '🏷️', label: 'Scolarité', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/scolarite/cycles', icon: '🎯', label: 'Cycles', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/examens', icon: '📝', label: 'Examens', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { to: '/notes', icon: '📊', label: 'Notes', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { to: '/emploi-du-temps', icon: '📅', label: 'Emploi du temps', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/enseignant/emploi-du-temps', icon: '📅', label: 'Emploi du temps', roles: [ROLES.ENSEIGNANT] },
  { to: '/absences', icon: '🗓️', label: 'Absences', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { to: '/discipline', icon: '🛡️', label: 'Discipline', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/transport', icon: '🚌', label: 'Transport', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/quartiers', icon: '📍', label: 'Quartiers', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/bibliotheque', icon: '📚', label: 'Bibliothèque', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/annonces', icon: '📢', label: 'Annonces', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT] },
  { to: '/comptes', icon: '🔑', label: 'Comptes admin', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/compte', icon: '👤', label: 'Mon compte', roles: [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT] },

  { to: '/parent/notes', icon: '📊', label: 'Notes / Bulletins', roles: [ROLES.PARENT] },
  { to: '/parent/absences', icon: '🗓️', label: 'Absences', roles: [ROLES.PARENT] },
  { to: '/parent/emploi-du-temps', icon: '📅', label: 'Emploi du temps', roles: [ROLES.PARENT] },
  { to: '/parent/transport', icon: '🚌', label: 'Transport', roles: [ROLES.PARENT] },
  { to: '/parent/paiements', icon: '💳', label: 'Paiements', roles: [ROLES.PARENT] },
]

// Si le rôle n'est pas encore résolu (session en cours de chargement), on
// n'affiche rien plutôt que de montrer un menu incohérent.
export function getNavForRole(roleKey) {
  return NAV_ITEMS.filter(item => roleKey && item.roles.includes(roleKey))
}
