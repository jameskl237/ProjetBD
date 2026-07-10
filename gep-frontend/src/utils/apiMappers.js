const DEFAULT_YEAR = '2025–2026'

export function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatApiDate(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

export function initialsFromParts(firstName = '', lastName = '') {
  return `${(firstName[0] || 'E').toUpperCase()}${(lastName[0] || 'L').toUpperCase()}`
}

export function mapEleveToStudent(eleve, index = 0) {
  const prenom = eleve?.prenom || ''
  const nom = eleve?.nom || ''
  const fullName = `${prenom} ${nom}`.trim() || 'Élève inconnu'
  const inscription = Array.isArray(eleve?.inscriptions) ? eleve.inscriptions[0] : Array.isArray(eleve?.frequentations) ? eleve.frequentations[0] : null
  const className = inscription?.classe?.libelle || inscription?.salle?.classe?.libelle || (inscription?.idSalle ? `Salle #${inscription.idSalle}` : 'Non inscrit')
  const gender = eleve?.sexe === 1 || eleve?.sexe === 'F' ? 'F' : 'M'

  return {
    id: eleve?.matricule != null ? String(eleve.matricule) : eleve?.id != null ? String(eleve.id) : `ELEVE-${index}`,
    studentId: eleve?.matricule ? String(eleve.matricule) : `ELV-${eleve?.id || index}`,
    fullName,
    firstName: prenom,
    lastName: nom,
    className,
    section: eleve?.langue || '—',
    gender,
    birthDate: eleve?.dateNaissance || '',
    birthDateLabel: formatApiDate(eleve?.dateNaissance),
    tutor: eleve?.tuteurs?.[0]?.tuteur ? `${eleve.tuteurs[0].tuteur.prenom || ''} ${eleve.tuteurs[0].tuteur.nom || ''}`.trim() : 'N/A',
    status: eleve?.actif === false ? 'inactive' : 'active',
    year: inscription?.anneeAcademique?.libelle || inscription?.annee?.libelle || DEFAULT_YEAR,
    initials: initialsFromParts(prenom, nom),
    color: '#6d28d9',
    raw: eleve,
  }
}

export function mapClasseToCard(classe, index = 0) {
  const label = classe?.libelle || `Classe #${classe?.id || index + 1}`
  const cycleLabel = classe?.cycle?.libelle || (classe?.idCycle ? `Cycle #${classe.idCycle}` : classe?.cycleId ? `Cycle #${classe.cycleId}` : 'Cycle')
  const effectif = classe?.effectif ?? 0
  const section = label.toLowerCase().includes('biling') ? 'Bilingue' : label.toLowerCase().includes('class') ? 'Anglophone' : 'Francophone'
  const sectionMeta = {
    Francophone: { icon: 'FR', accent: 'linear-gradient(90deg,#7C3AED,#A78BFA)', fill: 'linear-gradient(90deg,#7C3AED,#A78BFA)' },
    Anglophone: { icon: 'EN', accent: 'linear-gradient(90deg,#0284C7,#38BDF8)', fill: 'linear-gradient(90deg,#0284C7,#38BDF8)' },
    Bilingue: { icon: 'BI', accent: 'linear-gradient(90deg,#059669,#34D399)', fill: 'linear-gradient(90deg,#059669,#34D399)' },
  }[section]
  const salles = Array.isArray(classe?.salles) ? classe.salles : []
  const capacite = salles.reduce((sum, salle) => sum + (Number(salle.capacite) || 0), 0)
  const titulaire = classe?.titulaire

  return {
    id: String(classe?.idClasse || classe?.id || index + 1),
    identifier: classe?.code || classe?.idClasse || classe?.id || `CLS-${index + 1}`,
    name: label,
    code: classe?.code || label,
    level: label,
    cycleLabel,
    section,
    sectionIcon: sectionMeta.icon,
    room: salles.length > 0 ? salles.map(s => s.libelle).join(', ') : 'Aucune salle affectée',
    teacher: titulaire ? `${titulaire.prenom || ''} ${titulaire.nom || ''}`.trim() : 'Non affecté',
    effectif,
    average: classe?.moyenne != null ? `${Number(classe.moyenne).toFixed(1)}/20` : '—',
    incidents: classe?.incidents ?? 0,
    capacity: capacite || '—',
    observations: classe?.description || '—',
    subjects: Array.isArray(classe?.matieres) ? classe.matieres.map(matiere => ({
      id: matiere.idCours,
      name: matiere.libelle || `Matière #${matiere.idCours}`,
      coefficient: matiere.coefficient,
      tone: 'muted',
    })) : [],
    topStudents: Array.isArray(classe?.topStudents) ? classe.topStudents.map(student => ({
      id: student.matricule,
      fullName: `${student.prenom || ''} ${student.nom || ''}`.trim() || `Élève #${student.matricule}`,
      initials: `${(student.prenom?.[0] || '?').toUpperCase()}${(student.nom?.[0] || '').toUpperCase()}`,
      note: student.moyenne.toFixed(1),
    })) : [],
    accent: sectionMeta.accent,
    fill: sectionMeta.fill,
    raw: classe,
  }
}

export function mapInscriptionToRow(inscription, index = 0, activeAnneeId = null) {
  const eleve = inscription?.eleve || {}
  const prenom = eleve.prenom || ''
  const nom = eleve.nom || ''
  const fullName = `${prenom} ${nom}`.trim() || `Élève #${inscription?.matricule || index + 1}`
  const isActiveYear = activeAnneeId == null || inscription?.idAcademi === activeAnneeId

  return {
    id: inscription?.idFrequente != null ? String(inscription.idFrequente) : inscription?.id != null ? String(inscription.id) : `INS-${index + 1}`,
    studentId: eleve.matricule || inscription?.matricule || `#${index + 1}`,
    fullName,
    initials: initialsFromParts(prenom, nom),
    section: eleve.langue || '—',
    className: inscription?.classe?.libelle || `Salle #${inscription?.idSalle || '—'}`,
    year: inscription?.annee?.libelle || DEFAULT_YEAR,
    status: isActiveYear ? 'active' : 'cloturee',
    date: inscription?.created_at ? new Date(inscription.created_at) : new Date(),
    dateLabel: formatApiDate(inscription?.created_at),
    by: '—',
    balance: '—',
    percent: 0,
    observations: '',
    raw: inscription,
  }
}

export function mapPaiementToRow(payment) {
  const eleve = payment?.eleve
  const eleveName = eleve ? `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() : `Matricule #${payment?.matricule || '—'}`

  return {
    facture: payment?.operation_ID || `PAY-${payment?.idPaie || payment?.id}`,
    eleve: eleveName,
    classe: payment?.classe?.libelle || 'Non inscrit',
    type: payment?.comentaire || payment?.mode?.libelle || 'Paiement',
    montant: Number(payment?.montant || 0),
    date: formatApiDate(payment?.datePaie || payment?.datePaiement),
    statut: 'Payé',
    factureId: payment?.idPaie || payment?.id,
    classeColor: '#059669',
    raw: payment,
  }
}
