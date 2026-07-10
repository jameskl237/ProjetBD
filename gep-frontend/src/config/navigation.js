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

// Le backend renvoie un libellé "role" au login, mais /auth/me (rechargement de page)
// ne renvoie que type/typeAdmin/typePersonne : on retombe dessus si le libellé est absent.
// typeAdmin 1 (directeur) et 2 (secrétaire) sont tous deux "Administrateur" côté rôle —
// seule la gestion des comptes reste réservée au directeur (vérifié côté backend).
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

// Page d'accueil post-connexion, propre à chaque rôle (spec RBAC).
// Administrateur et Comptable réutilisent des tableaux de bord déjà réels
// (module administration / module paiements) ; Enseignant et Parent ont les leurs.
export function getDashboardPath(roleKey) {
  switch (roleKey) {
    case ROLES.COMPTABLE: return '/paiements'
    case ROLES.ENSEIGNANT: return '/enseignant/dashboard'
    case ROLES.PARENT: return '/parent/dashboard'
    default: return '/admin/dashboard'
  }
}

// Liste unique des sections de l'application, utilisée par toutes les barres de
// navigation pour qu'on puisse toujours rejoindre une autre page. Reflète
// exactement les pages accessibles par rôle définies dans la spec RBAC.
export const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/paiements', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.COMPTABLE] },
  { to: '/enseignant/dashboard', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.ENSEIGNANT] },
  { to: '/parent/dashboard', icon: '⊞', label: 'Tableau de bord', roles: [ROLES.PARENT] },
  { to: '/eleves', icon: '👦', label: 'Élèves', roles: [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE, ROLES.ENSEIGNANT] },
  { to: '/inscriptions', icon: '📋', label: 'Inscriptions', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/classes', icon: '🏫', label: 'Classes', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/salles', icon: '🚪', label: 'Salles', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/enseignants', icon: '🎓', label: 'Enseignants', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/parents', icon: '👨‍👩‍👧', label: 'Parents', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/paiements', icon: '💳', label: 'Paiements', roles: [ROLES.ADMINISTRATEUR, ROLES.COMPTABLE] },
  { to: '/admin/examens', icon: '📝', label: 'Examens', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { to: '/notes', icon: '📊', label: 'Notes', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT] },
  { to: '/enseignant/absences', icon: '🗓️', label: 'Absences', roles: [ROLES.ENSEIGNANT] },
  { to: '/enseignant/compte', icon: '👤', label: 'Compte', roles: [ROLES.ENSEIGNANT] },
  { to: '/admin/absences', icon: '🗓️', label: 'Absences', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/discipline', icon: '🛡️', label: 'Discipline', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/transport', icon: '🚌', label: 'Transport', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/annonces', icon: '📢', label: 'Annonces', roles: [ROLES.ADMINISTRATEUR, ROLES.ENSEIGNANT, ROLES.PARENT] },
  { to: '/admin/compte', icon: '💳', label: 'Compte', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/parametres', icon: '⚙️', label: 'Paramètres', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/admin/sauvegardes', icon: '🗄️', label: 'Sauvegardes', roles: [ROLES.ADMINISTRATEUR] },
  { to: '/parent/notes', icon: '📊', label: 'Notes / Bulletins', roles: [ROLES.PARENT] },
  { to: '/parent/absences', icon: '🗓️', label: 'Absences', roles: [ROLES.PARENT] },
  { to: '/parent/emploi-du-temps', icon: '📅', label: 'Emploi du temps', roles: [ROLES.PARENT] },
  { to: '/parent/transport', icon: '🚌', label: 'Transport', roles: [ROLES.PARENT] },
]

// Si le rôle n'est pas résolu (ex: session en cours de chargement), on affiche tout
// plutôt que de bloquer l'utilisateur sur une page sans issue.
export function getNavForRole(roleKey) {
  return NAV_ITEMS.filter(item => !roleKey || item.roles.includes(roleKey))
}
