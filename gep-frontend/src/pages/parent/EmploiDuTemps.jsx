import { useEffect, useState } from 'react'
import { emploiDuTempsApi, extractList } from '../../api'

const JOURS_ORDRE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export default function ParentEmploiDuTemps() {
  const [emploi, setEmploi] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    emploiDuTempsApi.list()
      .then(res => { if (!cancelled) setEmploi(extractList(res)) })
      .catch(() => { if (!cancelled) setFeedback("Impossible de charger l'emploi du temps.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const sorted = [...emploi].sort((a, b) => {
    const dayDiff = JOURS_ORDRE.indexOf((a.jour || '').toLowerCase()) - JOURS_ORDRE.indexOf((b.jour || '').toLowerCase())
    if (dayDiff !== 0) return dayDiff
    return (a.heure || '').localeCompare(b.heure || '')
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Emploi du temps</h1>
          <p className="page-sub">Emploi du temps de la classe de votre enfant.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Jour</th><th>Heure</th><th>Cours</th></tr></thead>
              <tbody>
                {sorted.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>Aucun créneau disponible.</td></tr>}
                {sorted.map(s => <tr key={s.idTemps}><td style={{ textTransform: 'capitalize' }}>{s.jour}</td><td>{s.heure}</td><td>{s.idCours}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
