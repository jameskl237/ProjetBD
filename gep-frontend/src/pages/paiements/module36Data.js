export const module36NavGroups = [
  {
    label: 'Paiements',
    items: [
      { label: 'Tableau de bord', icon: '⊞', to: '/paiements', end: true },
      { label: 'Liste des paiements', icon: '≡', to: '/paiements/liste' },
      { label: 'Enregistrer paiement', icon: '⊕', to: '/paiements/create' },
      { label: 'Impayés', icon: '⊘', to: '/paiements/impayes' },
      { label: 'Historique', icon: '⏱', to: '/paiements/historique' },
      { label: 'Factures', icon: '📄', to: '/paiements/factures' },
    ],
  },
  {
    label: 'Impressions / Exports',
    items: [
      { label: 'Liste de classe', icon: '👥', to: '/paiements/exports/liste-classe' },
      { label: 'Bulletin', icon: '📋', to: '/paiements/exports/bulletin' },
      { label: 'Facture', icon: '🖨', to: '/paiements/exports/facture' },
      { label: 'Fiche élève', icon: '📁', to: '/paiements/exports/fiche-eleve' },
      { label: 'Export Excel', icon: '📊', to: '/paiements/exports/excel' },
    ],
  },
]

export function formatFcfa(amount) {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export function getRetardBadge(days) {
  if (days >= 30) return { bg: '#FEE2E2', color: '#DC2626' }
  if (days >= 11) return { bg: '#FEF9C3', color: '#B45309' }
  return { bg: '#FEF3C7', color: '#D97706' }
}

export const module36ListStatusStyles = {
  Payé: { color: '#059669', bg: '#D1FAE5' },
  'En attente': { color: '#D97706', bg: '#FEF3C7' },
  'En retard': { color: '#DC2626', bg: '#FEE2E2' },
}

export function filterPaymentsList(payments, search) {
  const query = search.toLowerCase()
  return payments.filter(
    payment =>
      payment.eleve.toLowerCase().includes(query) ||
      payment.facture.toLowerCase().includes(query),
  )
}
