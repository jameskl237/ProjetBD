import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { eleveApi } from '../../api'
import Module33Layout from '../inscriptions/Module33Layout'
import { formatApiDate } from '../../utils/apiMappers'

const TABS = [
  { id: 'identite', label: 'Identité', icon: '👤' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'paiements', label: 'Paiements', icon: '💳' },
  { id: 'discipline', label: 'Discipline', icon: '🚨' },
]

export default function Show() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('identite')
  const [eleve, setEleve] = useState(null)
  const [notes, setNotes] = useState([])
  const [paiements, setPaiements] = useState([])
  const [rapports, setRapports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadEleve() {
      setIsLoading(true)
      setError('')
      try {
        const [eleveRes, notesRes, paiementsRes, rapportsRes] = await Promise.allSettled([
          eleveApi.details(id),
          eleveApi.notes(id),
          eleveApi.paiements(id),
          eleveApi.rapports(id),
        ])
        if (cancelled) return
        if (eleveRes.status === 'fulfilled') {
          setEleve(eleveRes.value.data)
        } else {
          setError("Impossible de charger l'élève")
        }
        setNotes(notesRes.status === 'fulfilled' ? notesRes.value.data : [])
        setPaiements(paiementsRes.status === 'fulfilled' ? paiementsRes.value.data?.paiements ?? [] : [])
        setRapports(rapportsRes.status === 'fulfilled' ? rapportsRes.value.data : [])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadEleve()
    return () => { cancelled = true }
  }, [id])

  if (isLoading) {
    return (
      <Module33Layout breadcrumb={['Élèves', 'Charger...', 'Fiche']} backTo="/eleves">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>Chargement...</div>
      </Module33Layout>
    )
  }

  if (error || !eleve) {
    return (
      <Module33Layout breadcrumb={['Élèves', 'Erreur', 'Fiche']} backTo="/eleves">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc2626' }}>{error}</div>
      </Module33Layout>
    )
  }

  const fullName = `${eleve.prenom || ''} ${eleve.nom || ''}`.trim()
  const initials = `${(eleve.prenom?.[0] || 'E').toUpperCase()}${(eleve.nom?.[0] || 'L').toUpperCase()}`
  const currentInscription = eleve.inscriptions?.[0]
  const primaryTutor = eleve.tuteurs?.[0]?.tuteur
  const isActif = eleve.actif === 1 || eleve.actif === true

  const moyenneGenerale = notes.length ? notes.reduce((sum, n) => sum + Number(n.note || 0), 0) / notes.length : null
  const totalPaye = paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0)

  const metrics = [
    { label: 'Moyenne générale', value: moyenneGenerale != null ? `${moyenneGenerale.toFixed(1)}/20` : '—' },
    { label: 'Évaluations', value: notes.length },
    { label: 'Total payé', value: `${totalPaye.toLocaleString('fr-FR')} F` },
    { label: 'Signalements', value: rapports.length },
  ]

  return (
    <Module33Layout breadcrumb={['Élèves', fullName || 'Fiche élève', 'Fiche']} backTo="/eleves">
      <div className="module33-hero">
        <div className="module33-hero-top">
          <div className="module33-hero-avatar">{initials}</div>
          <div style={{ flex: 1 }}>
            <div className="module33-hero-name">{fullName}</div>
            <div className="module33-hero-subtitle">{eleve.matricule || `#${id}`}</div>
            <div className="module33-hero-tags">
              <span className="module33-hero-tag primary">{eleve.langue || 'Section inconnue'}</span>
              <span className="module33-hero-tag cyan">{eleve.sexe === 1 ? 'Fille' : 'Garçon'}</span>
              <span className="module33-hero-tag green">{isActif ? 'Actif' : 'Inactif'}</span>
            </div>
          </div>
          <div>
            <div className={`module33-row-tag ${isActif ? 'success' : 'warning'}`} style={{ marginTop: 4 }}>
              <span className="bdot" />
              {isActif ? 'Actif' : 'Inactif'}
            </div>
          </div>
        </div>

        <div className="module33-hero-stats">
          {metrics.map(metric => (
            <div key={metric.label} className="module33-hero-stat">
              <div className="module33-hero-stat-value">{metric.value}</div>
              <div className="module33-hero-stat-label">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="module33-tab-bar">
        {TABS.map(tab => (
          <button key={tab.id} type="button" className={`module33-tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="module33-layout-card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <div className={`module33-panel${activeTab === 'identite' ? ' active' : ''}`}>
          <div className="module33-card-body">
            <div className="module33-grid-2">
              <div className="module33-card">
                <div className="module33-card-header">
                  <div className="module33-card-icon">👤</div>
                  <div>
                    <div className="module33-card-title">Informations personnelles</div>
                    <div className="module33-card-subtitle">État civil de l’élève</div>
                  </div>
                </div>
                <div className="module33-card-body">
                  <div className="module33-info-grid">
                    <div className="module33-info-item"><div className="module33-info-label">Nom complet</div><div className="module33-info-value">{fullName}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Matricule</div><div className="module33-info-value" style={{ fontFamily: 'monospace', color: 'var(--violet-profond)' }}>{eleve.matricule || `#${id}`}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Date de naissance</div><div className="module33-info-value">{formatApiDate(eleve.dateNaissance)}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Lieu de naissance</div><div className="module33-info-value">{eleve.lieuNaissance || '—'}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Ville de naissance</div><div className="module33-info-value">{eleve.ville?.libelle || '—'}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Sexe</div><div className="module33-info-value">{eleve.sexe === 1 ? 'Féminin' : 'Masculin'}</div></div>
                  </div>
                </div>
              </div>

              <div className="module33-card">
                <div className="module33-card-header">
                  <div className="module33-card-icon cyan">👨‍👩‍👧</div>
                  <div>
                    <div className="module33-card-title">Tuteur / Parent</div>
                    <div className="module33-card-subtitle">Responsable du dossier</div>
                  </div>
                </div>
                <div className="module33-card-body">
                  {primaryTutor ? (
                    <div className="module33-info-grid">
                      <div className="module33-info-item"><div className="module33-info-label">Nom</div><div className="module33-info-value">{`${primaryTutor.prenom || ''} ${primaryTutor.nom || ''}`.trim() || '—'}</div></div>
                      <div className="module33-info-item"><div className="module33-info-label">Téléphone</div><div className="module33-info-value">{primaryTutor.mobile || primaryTutor.phone || '—'}</div></div>
                      <div className="module33-info-item"><div className="module33-info-label">Email</div><div className="module33-info-value">{primaryTutor.email || '—'}</div></div>
                      <div className="module33-info-item"><div className="module33-info-label">Login</div><div className="module33-info-value">{primaryTutor.login || '—'}</div></div>
                    </div>
                  ) : (
                    <p className="module33-hint">Aucun tuteur associé à ce dossier.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="module33-grid-2" style={{ marginTop: 16 }}>
              <div className="module33-card">
                <div className="module33-card-header">
                  <div className="module33-card-icon green">🏫</div>
                  <div>
                    <div className="module33-card-title">Scolarité</div>
                    <div className="module33-card-subtitle">Affectation et suivi</div>
                  </div>
                </div>
                <div className="module33-card-body">
                  <div className="module33-info-grid">
                    <div className="module33-info-item"><div className="module33-info-label">Classe</div><div className="module33-info-value">{currentInscription?.classe?.libelle || 'Non inscrit'}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Section</div><div className="module33-info-value">{eleve.langue || '—'}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Année scolaire</div><div className="module33-info-value">{currentInscription?.annee?.libelle || '—'}</div></div>
                    <div className="module33-info-item"><div className="module33-info-label">Statut</div><div className="module33-info-value">{isActif ? 'Actif' : 'Inactif'}</div></div>
                  </div>
                </div>
              </div>

              <div className="module33-card">
                <div className="module33-card-header">
                  <div className="module33-card-icon amber">✨</div>
                  <div>
                    <div className="module33-card-title">Actions rapides</div>
                    <div className="module33-card-subtitle">Gestion du dossier</div>
                  </div>
                </div>
                <div className="module33-card-body" style={{ display: 'grid', gap: 10 }}>
                  <button className="module33-button-secondary" type="button" onClick={() => navigate(`/eleves/edit/${id}`)}>Modifier la fiche</button>
                  <button className="module33-button-danger" type="button" onClick={() => navigate(`/eleves/delete/${id}`)}>Désactiver le dossier</button>
                  <button className="module33-button" type="button" onClick={() => navigate('/eleves')}>Retour à la liste</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`module33-panel${activeTab === 'notes' ? ' active' : ''}`}>
          <div className="module33-card-body">
            <div className="module33-card" style={{ marginBottom: 16 }}>
              <div className="module33-card-header">
                <div className="module33-card-icon cyan">📝</div>
                <div>
                  <div className="module33-card-title">Résultats par matière</div>
                  <div className="module33-card-subtitle">Lecture rapide des performances</div>
                </div>
              </div>
              <div className="module33-card-body">
                {notes.length === 0 ? (
                  <p className="module33-hint">Aucune évaluation enregistrée pour cet élève.</p>
                ) : (
                  <table className="module33-mini-table">
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th>Enseignant</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map(note => (
                        <tr key={note.idEval}>
                          <td>{note.cours?.libelle || '—'}</td>
                          <td>{note.enseignant ? `${note.enseignant.prenom || ''} ${note.enseignant.nom || ''}`.trim() : '—'}</td>
                          <td><span className={`module33-row-tag ${note.note >= 14 ? 'success' : 'info'}`}>{note.note}/20</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`module33-panel${activeTab === 'paiements' ? ' active' : ''}`}>
          <div className="module33-card-body">
            <div className="module33-card">
              <div className="module33-card-header">
                <div className="module33-card-icon green">💳</div>
                <div>
                  <div className="module33-card-title">Paiements récents</div>
                  <div className="module33-card-subtitle">Scolarité et frais associés</div>
                </div>
              </div>
              <div className="module33-card-body">
                {paiements.length === 0 ? (
                  <p className="module33-hint">Aucun paiement enregistré pour cet élève.</p>
                ) : (
                  <table className="module33-mini-table">
                    <thead>
                      <tr>
                        <th>Commentaire</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paiements.map(payment => (
                        <tr key={payment.idPaie}>
                          <td>{payment.comentaire || 'Paiement'}</td>
                          <td>{formatApiDate(payment.datePaie)}</td>
                          <td>{Number(payment.montant || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td>{payment.mode?.libelle || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`module33-panel${activeTab === 'discipline' ? ' active' : ''}`}>
          <div className="module33-card-body">
            <div className="module33-card">
              <div className="module33-card-header">
                <div className="module33-card-icon amber">🚨</div>
                <div>
                  <div className="module33-card-title">Incidents et observations</div>
                  <div className="module33-card-subtitle">Historique éducatif et comportemental</div>
                </div>
              </div>
              <div className="module33-card-body">
                {rapports.length === 0 ? (
                  <p className="module33-hint">Aucun signalement enregistré pour cet élève.</p>
                ) : (
                  <div className="module33-timeline">
                    {rapports.map(item => (
                      <div key={item.idRap} className="module33-timeline-item">
                        <div className="module33-timeline-dot warning">!</div>
                        <div>
                          <div className="module33-timeline-title">{item.discipline?.libelle || 'Observation'}</div>
                          <div className="module33-timeline-detail">{item.commentaire}</div>
                          <div className="module33-timeline-time">{formatApiDate(item.event_date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Module33Layout>
  )
}
