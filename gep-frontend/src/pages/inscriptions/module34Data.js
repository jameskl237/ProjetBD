export const module34Sections = ['Tous', 'Francophone', 'Anglophone', 'Bilingue']

export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getInscriptionStatusLabel(status) {
  if (status === 'cloturee') return 'Clôturée'
  if (status === 'transfert') return 'Transfert'
  return 'Active'
}

export function getInscriptionStatusClass(status) {
  if (status === 'cloturee') return 'b-cloture'
  if (status === 'transfert') return 'b-transfert'
  return 'b-active'
}
