import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { paiementApi, extractList } from '../../api'
import { mapPaiementToRow } from '../../utils/apiMappers'
import Module36Layout from './Module36Layout'
import { formatFcfa } from './module36Data'

export default function Factures() {
  const { id } = useParams()
  const [payments, setPayments] = useState([])
  const [selectedId, setSelectedId] = useState(id || '')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let cancelled = false
    paiementApi.list()
      .then(response => {
        if (cancelled) return
        const rows = extractList(response).map(mapPaiementToRow)
        setPayments(rows)
        if (!selectedId && rows.length > 0) setSelectedId(String(rows[0].factureId))
      })
      .catch(() => { if (!cancelled) setFetchError('Impossible de charger les paiements depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const payment = useMemo(() => payments.find(p => String(p.factureId) === String(selectedId)), [payments, selectedId])

  return (
    <Module36Layout>
      <div className="module36-page-header">
        <div className="module36-greeting" style={{ marginBottom: 0 }}>
          <h1>Facture</h1>
          <p>Aperçu de la facture avant impression ou envoi.</p>
        </div>
        {payment && (
          <div className="module36-page-actions">
            <button type="button" className="module36-action-btn filled" onClick={() => window.print()}>🖨 Imprimer</button>
          </div>
        )}
      </div>

      <div className="module36-filters-card">
        <div className="module36-filters-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <label className="module36-filter-label" htmlFor="facture-select">N° Facture</label>
            <div className="module36-select-wrap">
              <select id="facture-select" className="module36-select" value={selectedId} onChange={event => setSelectedId(event.target.value)}>
                {payments.map(item => (
                  <option key={item.factureId} value={item.factureId}>{item.facture} — {item.eleve}</option>
                ))}
              </select>
              <span className="module36-select-arrow">▾</span>
            </div>
          </div>
        </div>
      </div>

      {fetchError && <div className="module36-invoice-wrap" style={{ padding: 16, color: '#b91c1c' }}>{fetchError}</div>}
      {loading && <div className="module36-invoice-wrap" style={{ padding: 16 }}>Chargement…</div>}

      {payment && (
        <div className="module36-invoice-wrap">
          <div className="module36-invoice-card">
            <div className="module36-invoice-body">
              <div className="module36-invoice-top">
                <div className="module36-invoice-school">
                  <div className="module36-invoice-school-icon">🏫</div>
                  <div>
                    <div className="module36-invoice-school-name">GEP Nebula</div>
                  </div>
                </div>
                <div className="module36-invoice-ref">
                  <div className="module36-invoice-badge">Facture</div>
                  <div className="module36-invoice-number">{payment.facture}</div>
                  <div className="module36-invoice-date">Émise le {payment.date}</div>
                </div>
              </div>

              <div className="module36-invoice-meta-grid">
                <div>
                  <div className="module36-invoice-section-label">Facturé à</div>
                  <div className="module36-invoice-client-name">{payment.eleve}</div>
                  <div className="module36-invoice-client-info">Classe : {payment.classe}</div>
                </div>
                <div>
                  <div className="module36-invoice-section-label">Détails</div>
                  <div className="module36-invoice-details">
                    <span className="module36-invoice-detail-label">Description :</span>{' '}
                    <strong className="module36-invoice-detail-value">{payment.type}</strong>
                    <br />
                    <span className="module36-invoice-detail-label">Statut :</span>{' '}
                    <strong className="module36-invoice-detail-value">{payment.statut}</strong>
                  </div>
                </div>
              </div>

              <table className="module36-invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{payment.type}</td>
                    <td>{formatFcfa(payment.montant)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="module36-invoice-totals">
                <div className="module36-invoice-totals-box">
                  <div className="module36-invoice-grand-total">
                    <span>Total payé</span>
                    <span>{formatFcfa(payment.montant)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Module36Layout>
  )
}
