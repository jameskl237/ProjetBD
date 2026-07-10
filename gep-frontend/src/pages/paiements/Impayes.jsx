import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, extractList } from '../../api'
import Module36Layout from './Module36Layout'
import { formatFcfa, getRetardBadge } from './module36Data'

function getInitiales(nom, prenom) {
  return `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?'
}

export default function Impayes() {
  const navigate = useNavigate()
  const [impayes, setImpayes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get('/paiements/impayes')
      .then(response => { if (!cancelled) setImpayes(extractList(response)) })
      .catch(() => { if (!cancelled) setFetchError('Impossible de charger les impayés depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const summary = useMemo(() => ({
    totalMontant: impayes.reduce((sum, item) => sum + item.montantDu, 0),
    totalEleves: impayes.length,
    retardMoyen: impayes.length > 0 ? Math.round(impayes.reduce((sum, item) => sum + item.retard, 0) / impayes.length) : 0,
  }), [impayes])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return impayes.filter(item => !query || `${item.eleve?.prenom || ''} ${item.eleve?.nom || ''}`.toLowerCase().includes(query))
  }, [impayes, search])

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Impayés</h1>
          <p>Élèves dont le solde de scolarité de l'année active n'est pas soldé.</p>
        </div>
      </div>

      {fetchError && <div className="module36-table-card" style={{ padding: 16, color: '#b91c1c' }}>{fetchError}</div>}

      <div className="module36-unpaid-stats">
        <div className="module36-unpaid-stat-highlight">
          <div className="module36-unpaid-stat-icon">⏰</div>
          <div>
            <div className="module36-unpaid-stat-label">Total impayés</div>
            <div className="module36-unpaid-stat-value">{formatFcfa(summary.totalMontant)}</div>
          </div>
        </div>
        <div className="module36-unpaid-stat-card">
          <div className="module36-unpaid-stat-label">Élèves concernés</div>
          <div className="module36-unpaid-stat-value">{summary.totalEleves}</div>
        </div>
        <div className="module36-unpaid-stat-card">
          <div className="module36-unpaid-stat-label">Retard moyen</div>
          <div className="module36-unpaid-stat-value">{summary.retardMoyen} jours</div>
        </div>
      </div>

      <div className="module36-table-card">
        <div className="module36-table-search">
          <div className="module36-table-search-wrap">
            <span className="module36-search-icon">🔍</span>
            <input
              className="module36-search-input"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Rechercher un élève..."
            />
          </div>
        </div>

        <table className="module36-table">
          <thead>
            <tr>
              {['Élève', 'Classe', 'Montant dû', 'Échéance', 'Retard', 'Action'].map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Chargement…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Aucun impayé — tous les élèves sont à jour.</td></tr>
            )}
            {filtered.map(row => {
              const badge = getRetardBadge(row.retard)
              return (
                <tr key={row.matricule}>
                  <td>
                    <div className="module36-table-student">
                      <div className="module36-table-avatar" style={{ background: '#7C3AED' }}>
                        {getInitiales(row.eleve?.nom, row.eleve?.prenom)}
                      </div>
                      <span className="module36-table-name">{row.eleve?.prenom} {row.eleve?.nom}</span>
                    </div>
                  </td>
                  <td>
                    <span className="module36-class-badge" style={{ background: '#7C3AED18', color: '#7C3AED' }}>
                      {row.classe?.libelle}
                    </span>
                  </td>
                  <td className="module36-table-amount">{formatFcfa(row.montantDu)}</td>
                  <td className="module36-table-date">{row.echeance ? new Date(row.echeance).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>
                    <span className="module36-retard-badge" style={{ background: badge.bg, color: badge.color }}>
                      {row.retard} jours
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="module36-pay-btn"
                      onClick={() => navigate('/paiements/create')}
                    >
                      💳 Payer maintenant
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Module36Layout>
  )
}
