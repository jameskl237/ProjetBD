import { useEffect, useMemo, useState } from 'react'
import { eleveApi, extractList, extractData } from '../../api'

const getAppreciation = (n) => {
  if (n >= 18) return 'Excellent'; if (n >= 16) return 'Très Bien'; if (n >= 14) return 'Bien';
  if (n >= 12) return 'Assez Bien'; if (n >= 10) return 'Passable'; if (n >= 8) return 'Médiocre';
  return 'Insuffisant';
}

export default function ParentNotes() {
  const [enfants, setEnfants] = useState([])
  const [matricule, setMatricule] = useState('')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    eleveApi.list()
      .then(res => {
        if (cancelled) return
        const list = extractList(res)
        setEnfants(list)
        if (list.length > 0) setMatricule(String(list[0].matricule))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger vos enfants.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!matricule) return
    let cancelled = false
    eleveApi.notes(matricule)
      .then(res => { if (!cancelled) setNotes(extractData(res) ?? []) })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les notes.') })
    return () => { cancelled = true }
  }, [matricule])

  const byMatiere = useMemo(() => {
    const map = new Map()
    notes.forEach(n => {
      const key = n.idCours
      if (!map.has(key)) map.set(key, { libelle: n.cours?.libelle, coefficient: n.cours?.coefficient || 1, notes: [] })
      map.get(key).notes.push(Number(n.note))
    })
    return [...map.values()]
  }, [notes])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes / Bulletins</h1>
          <p className="page-sub">Notes réelles de votre enfant.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      {enfants.length > 1 && (
        <div className="card mb-18">
          <div className="filters-row">
            <div className="filter-group"><label>Enfant</label>
              <select className="fselect" value={matricule} onChange={e => setMatricule(e.target.value)}>
                {enfants.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Matière</th><th>Coefficient</th><th>Moyenne</th><th>Appréciation</th></tr></thead>
              <tbody>
                {byMatiere.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Aucune note enregistrée.</td></tr>}
                {byMatiere.map((m, i) => {
                  const avg = m.notes.reduce((a, b) => a + b, 0) / m.notes.length
                  return (
                    <tr key={i}>
                      <td>{m.libelle}</td>
                      <td>{m.coefficient}</td>
                      <td style={{ fontWeight: 700, color: avg >= 10 ? '#059669' : '#E11D48' }}>{avg.toFixed(1)}</td>
                      <td>{getAppreciation(avg)}</td>
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
