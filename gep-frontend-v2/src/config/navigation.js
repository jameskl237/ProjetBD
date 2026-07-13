// Source unique de vérité pour les rôles et la navigation.
// Reprend exactement le RBAC du backend (middlewares/rbac.ts::getRole) pour
// qu'un seul et même composant Sidebar puisse servir tous les rôles.
export const ROLES = {
  ADMINISTRATEUR: 'administrateur',
  SECRETAIRE: 'secretaire',
  COMPTABLE: 'comptable',
  ENSEIGNANT: 'enseignant',
  PARENT: 'parent',
}

export const ROLE_LABELS = {
  [ROLES.ADMINISTRATEUR]: 'Directeur',
  [ROLES.SECRETAIRE]: 'Secrétaire',
  [ROLES.COMPTABLE]: 'Comptable',
  [ROLES.ENSEIGNANT]: 'Enseignant',
  [ROLES.PARENT]: 'Parent',
}

export function getRoleKey(user) {
  if (!user) return null
  if (user.type === 'admin') {
    if (user.typeAdmin === 1) return ROLES.ADMINISTRATEUR
    if (user.typeAdmin === 2) return ROLES.SECRETAIRE
    if (user.typeAdmin === 3) return ROLES.COMPTABLE
    return ROLES.ADMINISTRATEUR
  }
  if (user.type === 'personne') {
    return user.typePersonne === 1 ? ROLES.ENSEIGNANT : ROLES.PARENT
  }
  const label = (user.role || '').toLowerCase()
  if (label.includes('comptable')) return ROLES.COMPTABLE
  if (label.includes('enseignant')) return ROLES.ENSEIGNANT
  if (label.includes('parent')) return ROLES.PARENT
  if (label.includes('secr')) return ROLES.SECRETAIRE
  if (label.includes('directeur')) return ROLES.ADMINISTRATEUR
  return null
}

export function isDirecteur(user) {
  return user?.type === 'admin' && user?.typeAdmin === 1
}

export function isSecretaire(user) {
  return user?.type === 'admin' && user?.typeAdmin === 2
}

export function getDashboardPath(roleKey) {
  switch (roleKey) {
    case ROLES.COMPTABLE: return '/paiements'
    case ROLES.ENSEIGNANT: return '/enseignant'
    case ROLES.PARENT: return '/parent'
    default: return '/dashboard'
  }
}

const ADM = [ROLES.ADMINISTRATEUR]
const SEC = [ROLES.SECRETAIRE]
const ADM_SEC = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE]
const ADM_SEC_CPT = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.COMPTABLE]
const ADM_SEC_ENC = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT]
const ALL = [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.COMPTABLE, ROLES.ENSEIGNANT, ROLES.PARENT]

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', roles: ADM },
  { to: '/paiements', label: 'Tableau de bord', roles: [ROLES.COMPTABLE] },
  { to: '/enseignant', label: 'Tableau de bord', roles: [ROLES.ENSEIGNANT] },
  { to: '/parent', label: 'Tableau de bord', roles: [ROLES.PARENT] },

  { to: '/eleves', label: 'Élèves', roles: ADM_SEC_CPT },
  { to: '/classes', label: 'Classes', roles: ADM_SEC_ENC },
  { to: '/salles', label: 'Salles', roles: ADM },

  { to: '/cours', label: 'Cours & Matières', roles: ADM_SEC },
  { to: '/enseignants', label: 'Enseignants', roles: ADM_SEC },
  { to: '/emploi-du-temps', label: 'Emploi du temps', roles: ADM_SEC_ENC },

  { to: '/parents', label: 'Parents', roles: ADM_SEC },

  { to: '/paiements', label: 'Paiements', roles: ADM_SEC_CPT },

  { to: '/scolarite', label: 'Scolarité & Cycles', roles: ADM_SEC },

  { to: '/examens', label: 'Examens', roles: ADM_SEC_ENC },
  { to: '/notes', label: 'Notes', roles: ADM_SEC_ENC },
  { to: '/bulletins', label: 'Bulletins', roles: ADM_SEC },

  { to: '/discipline', label: 'Discipline', roles: ADM_SEC },

  { to: '/transport', label: 'Transport', roles: SEC },
  { to: '/quartiers', label: 'Quartiers', roles: ADM_SEC },

  { to: '/bibliotheque', label: 'Bibliothèque', roles: ADM },
  { to: '/annonces', label: 'Annonces', roles: [ROLES.ADMINISTRATEUR, ROLES.SECRETAIRE, ROLES.ENSEIGNANT, ROLES.PARENT] },

  { to: '/compte', label: 'Mon compte', roles: ALL },

  { to: '/parent/notes', label: 'Notes & Bulletins', roles: [ROLES.PARENT] },
  { to: '/parent/absences', label: 'Absences', roles: [ROLES.PARENT] },
  { to: '/parent/emploi-du-temps', label: 'Emploi du temps', roles: [ROLES.PARENT] },
  { to: '/parent/transport', label: 'Transport', roles: [ROLES.PARENT] },
  { to: '/parent/paiements', label: 'Paiements', roles: [ROLES.PARENT] },
]

export function getNavForRole(roleKey) {
  const items = NAV_ITEMS.filter(item => roleKey && item.roles.includes(roleKey))
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item.to)) return false
    seen.add(item.to)
    return true
  })
}
