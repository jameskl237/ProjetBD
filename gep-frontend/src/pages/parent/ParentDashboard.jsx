import { useEffect, useState } from 'react'
import { eleveApi, absenceApi, abonnementApi, extractList, extractData } from '../../api'
import useAuth from '../../hooks/useAuth'
import UserMenu from '../../components/layout/UserMenu'

const TRANSPORT_LABELS = { 0: 'Aucun', 1: 'Aller simple', 2: 'Aller-retour' }

function moyenneFrom(notes) {
  if (!notes || notes.length === 0) return null
  const total = notes.reduce((s, n) => s + Number(n.note), 0)
  return total / notes.length
}

export default function ParentDashboard() {
  const { user } = useAuth()
  const [enfants, setEnfants] = useState([])
  const [notesByMatricule, setNotesByMatricule] = useState({})
  const [absences, setAbsences] = useState([])
  const [abonnements, setAbonnements] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([eleveApi.list(), absenceApi.list(), abonnementApi.list()])
      .then(async ([elevesRes, absRes, aboRes]) => {
        if (cancelled) return
        const children = extractList(elevesRes)
        setEnfants(children)
        setAbsences(extractList(absRes))
        setAbonnements(extractList(aboRes))
        const notesEntries = await Promise.all(
          children.map(c => eleveApi.notes(c.matricule).then(r => [c.matricule, extractData(r)]).catch(() => [c.matricule, []])),
        )
        if (!cancelled) setNotesByMatricule(Object.fromEntries(notesEntries))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger vos données.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bonjour{user?.nom ? `, ${user.nom}` : ''} 👋</h1>
          <p className="page-sub">Aperçu de la scolarité de vos enfants.</p>
        </div>
        <UserMenu />
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      {loading ? (
        <div className="card" style={{ padding: 20 }}>Chargement…</div>
      ) : enfants.length === 0 ? (
        <div className="card" style={{ padding: 20 }}>Aucun enfant lié à votre compte pour le moment.</div>
      ) : (
        enfants.map(enfant => {
          const moy = moyenneFrom(notesByMatricule[enfant.matricule])
          const dernieresAbsences = absences.filter(a => a.matricule === enfant.matricule).slice(0, 5)
          const abonnement = abonnements.find(a => a.matricule === enfant.matricule)
          return (
            <div className="card mb-18" key={enfant.matricule} style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>{enfant.prenom} {enfant.nom} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({enfant.matricule})</span></h3>
              <div className="filters-row">
                <div className="filter-group"><label>Moyenne générale</label>
                  <div style={{ fontWeight: 700, fontSize: 18, color: moy == null ? '#94a3b8' : moy >= 10 ? '#059669' : '#E11D48' }}>{moy != null ? moy.toFixed(2) : '—'}</div>
                </div>
                <div className="filter-group"><label>Statut transport</label>
                  <div style={{ fontWeight: 600 }}>{abonnement ? `${TRANSPORT_LABELS[abonnement.type] ?? abonnement.type}${abonnement.actif ? '' : ' (inactif)'}` : 'Aucun abonnement'}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 13, color: '#64748b' }}>Dernières absences</label>
                {dernieresAbsences.length === 0 ? (
                  <div style={{ padding: 8 }}>Aucune absence récente.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Date</th><th>Justifiée</th><th>Commentaire</th></tr></thead>
                      <tbody>
                        {dernieresAbsences.map(a => (
                          <tr key={a.idAbsence}><td>{a.date}</td><td>{a.justifiee ? 'Oui' : 'Non'}</td><td>{a.commentaire}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
