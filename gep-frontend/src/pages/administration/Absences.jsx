import { useEffect, useMemo, useState } from 'react'
import { absenceApi, api, extractList } from '../../api'

export default function Absences() {
  const [absences, setAbsences] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  function load() {
    setLoading(true)
    return absenceApi.list()
      .then(res => setAbsences(extractList(res)))
      .catch(() => setFeedback('Impossible de charger les absences.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return absences
    return absences.filter(a => `${a.eleve?.prenom} ${a.eleve?.nom} ${a.matricule}`.toLowerCase().includes(query))
  }, [absences, search])

  async function toggleJustifiee(absence) {
    try {
      await api.put(`/absences/${absence.idAbsence}/justifier`, { justifiee: !absence.justifiee })
      await load()
    } catch {
      setFeedback('Impossible de mettre à jour cette absence.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Absences</h1>
          <p className="page-sub">Toutes les absences enregistrées par les enseignants.</p>
        </div>
      </div>

      {feedback && <div className="card mb-18" style={{ padding: 12 }}>{feedback}</div>}

      <div className="card mb-18">
        <div className="filters-row">
          <div className="filter-group fg-2"><label>Recherche</label>
            <input className="finput" placeholder="Nom ou matricule..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Chargement…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Élève</th><th>Cours</th><th>Date</th><th>Enregistrée par</th><th>Justifiée</th><th></th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Aucune absence enregistrée.</td></tr>}
                {filtered.map(a => (
                  <tr key={a.idAbsence}>
                    <td>{a.eleve?.prenom} {a.eleve?.nom} <span style={{ color: '#94a3b8' }}>({a.matricule})</span></td>
                    <td>{a.cours?.libelle}</td>
                    <td>{a.date}</td>
                    <td>{a.auteur ? `${a.auteur.nom ?? ''} ${a.auteur.prenom ?? ''}`.trim() : '—'}</td>
                    <td>{a.justifiee ? 'Oui' : 'Non'}</td>
                    <td><button className="btn-outline" onClick={() => toggleJustifiee(a)}>{a.justifiee ? 'Retirer justification' : 'Justifier'}</button></td>
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
