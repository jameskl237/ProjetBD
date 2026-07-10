import { useEffect, useMemo, useState } from 'react'
import { eleveApi, api, extractData, extractList } from '../../../api'
import { formatApiDate } from '../../../utils/apiMappers'
import Module36Layout from '../Module36Layout'
import { formatFcfa } from '../module36Data'

export default function FicheEleve() {
  const [eleves, setEleves] = useState([])
  const [matricule, setMatricule] = useState('')
  const [eleve, setEleve] = useState(null)
  const [totalPaye, setTotalPaye] = useState(0)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    eleveApi.list()
      .then(response => {
        if (cancelled) return
        const list = extractList(response)
        setEleves(list)
        if (list.length > 0) setMatricule(String(list[0].matricule))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les élèves.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!matricule) return
    let cancelled = false
    Promise.all([eleveApi.get(matricule), api.get(`/paiements/eleve/${matricule}`)])
      .then(([eleveRes, paiementsRes]) => {
        if (cancelled) return
        setEleve(extractData(eleveRes))
        setTotalPaye(extractData(paiementsRes)?.total ?? 0)
      })
      .catch(() => { if (!cancelled) setFeedback("Impossible de charger la fiche de cet élève.") })
    return () => { cancelled = true }
  }, [matricule])

  const inscription = eleve?.inscriptions?.[0]
  const tuteur = eleve?.tuteurs?.[0]?.tuteur

  const fields = useMemo(() => {
    if (!eleve) return []
    return [
      { label: 'Matricule', value: eleve.matricule },
      { label: 'Classe', value: inscription?.classe?.libelle || 'Non inscrit' },
      { label: 'Date de naissance', value: formatApiDate(eleve.dateNaissance) },
      { label: 'Sexe', value: eleve.sexe === 1 ? 'Féminin' : 'Masculin' },
      { label: 'Tuteur / Responsable', value: tuteur ? `${tuteur.prenom || ''} ${tuteur.nom || ''}`.trim() : 'Aucun' },
      { label: 'Téléphone', value: tuteur?.mobile || tuteur?.phone || '—' },
      { label: 'Statut', value: eleve.actif ? 'Actif' : 'Inactif' },
      { label: 'Total payé', value: formatFcfa(totalPaye) },
    ]
  }, [eleve, inscription, tuteur, totalPaye])

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Fiche élève</h1>
          <p>Consultez et imprimez la fiche administrative d&apos;un élève.</p>
        </div>
        {eleve && (
          <div className="module36-page-actions">
            <button type="button" className="module36-action-btn filled" onClick={() => window.print()}>🖨 Imprimer</button>
          </div>
        )}
      </div>

      {feedback && <div className="module36-filters-card" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="fiche-eleve">Élève</label>
            <div className="module36-select-wrap">
              <select id="fiche-eleve" className="module36-select" value={matricule} onChange={event => setMatricule(event.target.value)}>
                {eleves.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="module36-export-preview" style={{ padding: 16 }}>Chargement…</div>
      ) : eleve && (
        <div className="module36-export-preview">
          <div className="module36-export-preview-header">
            <div>
              <div className="module36-export-school">GEP Nebula</div>
              <div className="module36-export-meta">Fiche administrative</div>
              <div className="module36-export-meta">{eleve.prenom} {eleve.nom} · {inscription?.classe?.libelle || 'Non inscrit'}</div>
            </div>
            <span className="module36-export-badge">Fiche élève</span>
          </div>

          <div className="module36-profile-grid">
            {fields.map(field => (
              <div key={field.label} className="module36-profile-field">
                <label>{field.label}</label>
                <span>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Module36Layout>
  )
}
