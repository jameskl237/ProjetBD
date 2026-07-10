import { useEffect, useState } from 'react'
import { eleveApi, absenceApi, extractList } from '../../api'

export default function ParentAbsences() {
  const [enfants, setEnfants] = useState([])
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([eleveApi.list(), absenceApi.list()])
      .then(([elevesRes, absRes]) => {
        if (cancelled) return
        setEnfants(extractList(elevesRes))
        setAbsences(extractList(absRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les absences.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const enfantNom = (matricule) => {
    const e = enfants.find(x => x.matricule === matricule)
    return e ? `${e.prenom} ${e.nom}` : matricule
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Absences</h1>
          <p className="page-sub">Absences enregistrées pour vos enfants.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Enfant</th><th>Cours</th><th>Date</th><th>Justifiée</th><th>Commentaire</th></tr></thead>
              <tbody>
                {absences.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Aucune absence enregistrée.</td></tr>}
                {absences.map(a => (
                  <tr key={a.idAbsence}>
                    <td>{enfantNom(a.matricule)}</td>
                    <td>{a.cours?.libelle}</td>
                    <td>{a.date}</td>
                    <td>{a.justifiee ? 'Oui' : 'Non'}</td>
                    <td>{a.commentaire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
