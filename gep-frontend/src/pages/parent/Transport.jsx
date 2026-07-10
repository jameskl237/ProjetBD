import { useEffect, useState } from 'react'
import { eleveApi, abonnementApi, extractList } from '../../api'

const TRANSPORT_LABELS = { 0: 'Aucun', 1: 'Aller simple', 2: 'Aller-retour' }

export default function ParentTransport() {
  const [enfants, setEnfants] = useState([])
  const [abonnements, setAbonnements] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([eleveApi.list(), abonnementApi.list()])
      .then(([elevesRes, aboRes]) => {
        if (cancelled) return
        setEnfants(extractList(elevesRes))
        setAbonnements(extractList(aboRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger le statut transport.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transport</h1>
          <p className="page-sub">Statut de l'abonnement transport de vos enfants.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : enfants.length === 0 ? (
          <div style={{ padding: 20 }}>Aucun enfant lié à votre compte.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Enfant</th><th>Type d'abonnement</th><th>Statut</th><th>Depuis</th><th>Jusqu'au</th></tr></thead>
              <tbody>
                {enfants.map(enfant => {
                  const abonnement = abonnements.find(a => a.matricule === enfant.matricule)
                  return (
                    <tr key={enfant.matricule}>
                      <td>{enfant.prenom} {enfant.nom}</td>
                      <td>{abonnement ? (TRANSPORT_LABELS[abonnement.type] ?? abonnement.type) : 'Aucun abonnement'}</td>
                      <td>{abonnement ? (abonnement.actif ? 'Actif' : 'Inactif') : '—'}</td>
                      <td>{abonnement?.dateDebut ?? '—'}</td>
                      <td>{abonnement?.dateFin ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
