export const module33Sections = ['Tous', 'Francophone', 'Anglophone', 'Bilingue']

export const module33SearchModes = [
  { label: 'Carte', value: 'cards' },
  { label: 'Table', value: 'table' },
]

function formatDateValue(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatSearchDate(date) {
  return formatDateValue(date)
}

export function getStudentStatusLabel(status) {
  if (status === 'inactive') return 'Désactivé'
  if (status === 'warning') return 'À surveiller'
  return 'Actif'
}

export function getStudentStatusClass(status) {
  if (status === 'inactive') return 'danger'
  if (status === 'warning') return 'warning'
  return 'success'
}
