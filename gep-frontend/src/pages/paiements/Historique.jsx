import { useEffect, useMemo, useState } from 'react'
import { eleveApi, api, extractData, extractList } from '../../api'
import Module36Layout from './Module36Layout'
import { formatFcfa } from './module36Data'

export default function Historique() {
  const [eleves, setEleves] = useState([])
  const [matricule, setMatricule] = useState('')
  const [payments, setPayments] = useState([])
  const [typeFiltre, setTypeFiltre] = useState('Tous types')
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
    api.get(`/paiements/eleve/${matricule}`)
      .then(response => { if (!cancelled) setPayments(extractData(response)?.paiements ?? []) })
      .catch(() => { if (!cancelled) setFeedback("Impossible de charger l'historique de cet élève.") })
    return () => { cancelled = true }
  }, [matricule])

  const types = useMemo(() => ['Tous types', ...new Set(payments.map(p => p.comentaire || p.mode?.libelle || 'Paiement'))], [payments])

  const filtered = useMemo(() => {
    return payments
      .filter(p => typeFiltre === 'Tous types' || (p.comentaire || p.mode?.libelle || 'Paiement') === typeFiltre)
      .sort((a, b) => new Date(b.datePaie) - new Date(a.datePaie))
  }, [payments, typeFiltre])

  const total = filtered.reduce((sum, p) => sum + Number(p.montant || 0), 0)
  const selectedEleve = eleves.find(e => String(e.matricule) === matricule)

  return (
    <Module36Layout>
      <div className="module36-greeting">
        <h1>Historique des paiements</h1>
        <p>Consultez l&apos;historique complet des paiements par élève.</p>
      </div>

      {feedback && <div className="module36-filters-card" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="historique-eleve">Élève</label>
            <div className="module36-select-wrap">
              <select
                id="historique-eleve"
                className="module36-select"
                value={matricule}
                onChange={event => setMatricule(event.target.value)}
              >
                {eleves.map(e => (
                  <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>
                ))}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
          <div>
            <label className="module36-filter-label" htmlFor="historique-type">Type</label>
            <div className="module36-select-wrap">
              <select
                id="historique-type"
                className="module36-select"
                value={typeFiltre}
                onChange={event => setTypeFiltre(event.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      <div className="module36-timeline-card">
        <div className="module36-timeline-header">
          <span className="module36-timeline-title">{selectedEleve ? `${selectedEleve.prenom} ${selectedEleve.nom}` : ''} — Historique</span>
          <div>
            <div className="module36-timeline-total-label">Total payé</div>
            <div className="module36-timeline-total-value">{formatFcfa(total)}</div>
          </div>
        </div>

        <div className="module36-timeline">
          <div className="module36-timeline-line" />
          <div className="module36-timeline-list">
            {!loading && filtered.map(payment => (
              <div key={payment.idPaie} className="module36-timeline-entry">
                <div className="module36-timeline-dot" style={{ background: '#059669', boxShadow: '0 0 0 3px #fff, 0 0 0 5px #D1FAE5' }}>
                  ✓
                </div>
                <div className="module36-timeline-item">
                  <div>
                    <div className="module36-timeline-type">{payment.comentaire || payment.mode?.libelle || 'Paiement'}</div>
                    <div className="module36-timeline-meta">
                      <span>📅</span>
                      {new Date(payment.datePaie).toLocaleDateString('fr-FR')} · {payment.mode?.libelle || '—'}
                    </div>
                    <div className="module36-timeline-invoice">PAY-{payment.idPaie}</div>
                  </div>
                  <div className="module36-timeline-right">
                    <div className="module36-timeline-amount">{formatFcfa(payment.montant)}</div>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="module36-timeline-empty">Aucun paiement trouvé pour ce filtre.</div>
            )}
          </div>
        </div>
      </div>
    </Module36Layout>
  )
}
