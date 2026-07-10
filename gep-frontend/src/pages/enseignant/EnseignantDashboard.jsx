import { useEffect, useMemo, useState } from 'react'
import { enseignantApi, emploiDuTempsApi, extractList } from '../../api'
import useAuth from '../../hooks/useAuth'

const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const [affectations, setAffectations] = useState([])
  const [emploi, setEmploi] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([enseignantApi.list(), emploiDuTempsApi.list()])
      .then(([ensRes, edtRes]) => {
        if (cancelled) return
        setAffectations(extractList(ensRes).filter(e => e.idPers === user?.id))
        setEmploi(extractList(edtRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger vos données.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  const mesClasses = useMemo(() => {
    const map = new Map()
    affectations.forEach(a => {
      const classe = a.cours?.classe
      if (classe?.idClasse != null && !map.has(classe.idClasse)) map.set(classe.idClasse, classe)
    })
    return [...map.values()]
  }, [affectations])

  const today = JOURS_FR[new Date().getDay()]
  const todaySessions = useMemo(
    () => emploi.filter(e => (e.jour || '').toLowerCase() === today).sort((a, b) => (a.heure || '').localeCompare(b.heure || '')),
    [emploi, today],
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bonjour{user?.nom ? `, ${user.nom}` : ''} 👋</h1>
          <p className="page-sub">Vos classes et votre emploi du temps du jour.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card mb-18">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Mes classes</h3>
        </div>
        {loading ? (
          <div style={{ padding: 16 }}>Chargement…</div>
        ) : mesClasses.length === 0 ? (
          <div style={{ padding: 16 }}>Aucune classe affectée pour le moment.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Classe</th></tr></thead>
              <tbody>
                {mesClasses.map(c => <tr key={c.idClasse}><td>{c.libelle}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Emploi du temps — aujourd'hui</h3>
        </div>
        {loading ? (
          <div style={{ padding: 16 }}>Chargement…</div>
        ) : todaySessions.length === 0 ? (
          <div style={{ padding: 16 }}>Aucun cours prévu aujourd'hui.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Heure</th><th>Cours</th></tr></thead>
              <tbody>
                {todaySessions.map(s => <tr key={s.idTemps}><td>{s.heure}</td><td>{s.idCours}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
