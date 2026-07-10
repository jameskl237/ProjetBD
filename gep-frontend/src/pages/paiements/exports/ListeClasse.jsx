import { useEffect, useMemo, useState } from 'react'
import { classeApi, api, extractList } from '../../../api'
import { formatApiDate } from '../../../utils/apiMappers'
import Module36Layout from '../Module36Layout'

export default function ListeClasse() {
  const [classes, setClasses] = useState([])
  const [classeId, setClasseId] = useState('')
  const [eleves, setEleves] = useState([])
  const [impayes, setImpayes] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([classeApi.list(), api.get('/paiements/impayes')])
      .then(([classesRes, impayesRes]) => {
        if (cancelled) return
        const list = extractList(classesRes)
        setClasses(list)
        if (list.length > 0) setClasseId(String(list[0].idClasse))
        setImpayes(extractList(impayesRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les classes.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!classeId) return
    let cancelled = false
    api.get(`/classes/${classeId}/eleves`)
      .then(response => { if (!cancelled) setEleves(extractList(response)) })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les élèves de cette classe.') })
    return () => { cancelled = true }
  }, [classeId])

  const impayeByMatricule = useMemo(() => new Set(impayes.map(i => i.matricule)), [impayes])
  const selectedClasse = classes.find(c => String(c.idClasse) === classeId)

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Liste de classe</h1>
          <p>Générez et imprimez la liste officielle des élèves par classe.</p>
        </div>
        <div className="module36-page-actions">
          <button type="button" className="module36-action-btn filled" onClick={() => window.print()}>🖨 Imprimer</button>
        </div>
      </div>

      {feedback && <div className="module36-filters-card" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="classe-select">Classe</label>
            <div className="module36-select-wrap">
              <select id="classe-select" className="module36-select" value={classeId} onChange={event => setClasseId(event.target.value)}>
                {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      <div className="module36-export-preview">
        <div className="module36-export-preview-header">
          <div>
            <div className="module36-export-school">GEP Nebula</div>
            <div className="module36-export-meta">Liste de classe · {selectedClasse?.libelle}</div>
            <div className="module36-export-meta">{eleves.length} élève(s) inscrit(s)</div>
          </div>
          <span className="module36-export-badge">Liste officielle</span>
        </div>

        <div className="module36-table-card" style={{ boxShadow: 'none' }}>
          <table className="module36-table">
            <thead>
              <tr>
                {['N°', 'Matricule', 'Nom complet', 'Sexe', 'Date de naissance', 'Statut paiement'].map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="module36-timeline-empty">Chargement…</td></tr>}
              {!loading && eleves.length === 0 && (
                <tr><td colSpan={6} className="module36-timeline-empty">Aucun élève pour cette classe.</td></tr>
              )}
              {eleves.map((eleve, index) => {
                const impaye = impayeByMatricule.has(eleve.matricule)
                return (
                  <tr key={eleve.matricule} className="list-row">
                    <td className="module36-table-date">{index + 1}</td>
                    <td className="module36-table-invoice">{eleve.matricule}</td>
                    <td className="module36-table-name">{eleve.prenom} {eleve.nom}</td>
                    <td className="module36-table-type">{eleve.sexe === 1 ? 'F' : 'M'}</td>
                    <td className="module36-table-date">{formatApiDate(eleve.dateNaissance)}</td>
                    <td>
                      <span
                        className="module36-list-status-badge"
                        style={{ background: impaye ? '#FEE2E2' : '#D1FAE5', color: impaye ? '#DC2626' : '#059669' }}
                      >
                        ● {impaye ? 'Impayé' : 'À jour'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Module36Layout>
  )
}
