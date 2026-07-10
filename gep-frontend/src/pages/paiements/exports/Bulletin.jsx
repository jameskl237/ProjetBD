import { useEffect, useState } from 'react'
import { classeApi, api, extractData, extractList } from '../../../api'
import Module36Layout from '../Module36Layout'

export default function Bulletin() {
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [eleves, setEleves] = useState([])
  const [matricule, setMatricule] = useState('')
  const [bulletin, setBulletin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    classeApi.list()
      .then(response => {
        if (cancelled) return
        const list = extractList(response)
        setClasses(list)
        if (list.length > 0) setClasseId(String(list[0].idClasse))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les classes.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!classeId) return
    let cancelled = false
    api.get(`/classes/${classeId}/eleves`)
      .then(response => {
        if (cancelled) return
        const list = extractList(response)
        setEleves(list)
        setMatricule(list[0]?.matricule ? String(list[0].matricule) : '')
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les élèves de cette classe.') })
    return () => { cancelled = true }
  }, [classeId])

  useEffect(() => {
    if (!matricule) { setBulletin(null); return }
    let cancelled = false
    api.get(`/evaluations/bulletin/${matricule}`)
      .then(response => { if (!cancelled) setBulletin(extractData(response)) })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger le bulletin.') })
    return () => { cancelled = true }
  }, [matricule])

  const selectedClasse = classes.find(c => String(c.idClasse) === classeId)
  const selectedEleve = eleves.find(e => String(e.matricule) === matricule)

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Bulletin scolaire</h1>
          <p>Consultez et imprimez les bulletins de notes par élève.</p>
        </div>
        {bulletin && (
          <div className="module36-page-actions">
            <button type="button" className="module36-action-btn filled" onClick={() => window.print()}>🖨 Imprimer</button>
          </div>
        )}
      </div>

      {feedback && <div className="module36-filters-card" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="bulletin-classe">Classe</label>
            <div className="module36-select-wrap">
              <select id="bulletin-classe" className="module36-select" value={classeId} onChange={event => setClasseId(event.target.value)}>
                {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
          <div>
            <label className="module36-filter-label" htmlFor="bulletin-eleve">Élève</label>
            <div className="module36-select-wrap">
              <select id="bulletin-eleve" className="module36-select" value={matricule} onChange={event => setMatricule(event.target.value)}>
                {eleves.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="module36-export-preview" style={{ padding: 16 }}>Chargement…</div>
      ) : bulletin && selectedEleve && (
        <div className="module36-export-preview">
          <div className="module36-export-preview-header">
            <div>
              <div className="module36-export-school">GEP Nebula</div>
              <div className="module36-export-meta">Bulletin</div>
              <div className="module36-export-meta">
                {selectedEleve.prenom} {selectedEleve.nom} · Classe {selectedClasse?.libelle} · Matricule {selectedEleve.matricule}
              </div>
            </div>
            <span className="module36-export-badge">Bulletin</span>
          </div>

          {bulletin.sessions.length === 0 ? (
            <p style={{ padding: 16 }}>Aucune évaluation enregistrée pour cet élève.</p>
          ) : bulletin.sessions.map(s => (
            <table key={s.session} className="module36-invoice-table" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>{s.session}</th>
                  <th>Coef.</th>
                  <th>Note /20</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {s.lignes.map((ligne, i) => (
                  <tr key={i}>
                    <td>{ligne.cours}</td>
                    <td style={{ textAlign: 'right' }}>{ligne.coef}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{ligne.note}</td>
                    <td>{ligne.appreciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

          <div className="module36-bulletin-summary">
            <span>Moyenne générale</span>
            <span>{bulletin.moyenneGenerale} / 20</span>
          </div>
        </div>
      )}
    </Module36Layout>
  )
}
