import { useEffect, useState } from 'react'
import { paiementApi, api, extractList } from '../../api'
import useAuth from '../../hooks/useAuth'
import Module36Layout from './Module36Layout'
import { mapPaiementToRow } from '../../utils/apiMappers'
import { formatFcfa, getRetardBadge } from './module36Data'

function getInitialesFromName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [impayes, setImpayes] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([paiementApi.list(), api.get('/paiements/impayes')])
      .then(([paiementsRes, impayesRes]) => {
        if (cancelled) return
        setPayments(extractList(paiementsRes).map(mapPaiementToRow))
        setImpayes(extractList(impayesRes))
      })
      .catch(() => { if (!cancelled) setFeedback('Impossible de charger les données depuis le backend.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const now = new Date()
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.raw?.datePaie)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const totalThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.montant, 0)
  const totalImpayes = impayes.reduce((sum, i) => sum + i.montantDu, 0)

  const stats = [
    { label: 'Encaissé ce mois', value: formatFcfa(totalThisMonth), icon: '💰', iconBg: '#D1FAE5' },
    { label: 'Paiements ce mois', value: thisMonthPayments.length, icon: '🧾', iconBg: '#DBEAFE' },
    { label: 'Total impayés', value: formatFcfa(totalImpayes), icon: '⏰', iconBg: '#FEE2E2' },
    { label: 'Élèves en retard', value: impayes.length, icon: '⚠️', iconBg: '#FEF3C7' },
  ]

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.raw?.datePaie || 0) - new Date(a.raw?.datePaie || 0))
    .slice(0, 6)

  const urgentUnpaid = impayes.slice(0, 6)

  return (
    <Module36Layout>
      <div className="module36-greeting">
        <h1>Bonjour{user?.login ? `, ${user.login}` : ''} 👋</h1>
        <p>Voici un aperçu réel de l'activité de paiements de l'école.</p>
      </div>

      {feedback && <div className="module36-panel" style={{ padding: 16, color: '#b91c1c' }}>{feedback}</div>}

      <div className="module36-stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="module36-stat-card">
            <div>
              <div className="module36-stat-label">{stat.label}</div>
              <div className="module36-stat-value">{loading ? '…' : stat.value}</div>
            </div>
            <div className="module36-stat-icon" style={{ background: stat.iconBg }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="module36-bottom-grid">
        <div className="module36-panel">
          <div className="module36-panel-header">
            <span className="module36-panel-title">Paiements récents</span>
          </div>
          <div className="module36-payment-list">
            {!loading && recentPayments.length === 0 && <p style={{ padding: 12 }}>Aucun paiement enregistré.</p>}
            {recentPayments.map(payment => (
              <div key={payment.facture} className="module36-payment-row">
                <div className="module36-payment-avatar" style={{ background: payment.classeColor }}>
                  {getInitialesFromName(payment.eleve)}
                </div>
                <div className="module36-payment-info">
                  <div className="module36-payment-name">{payment.eleve}</div>
                  <div className="module36-payment-detail">{payment.type} · {payment.date}</div>
                </div>
                <div className="module36-payment-amount">{formatFcfa(payment.montant)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="module36-panel">
          <div className="module36-panel-header">
            <span className="module36-panel-title">Impayés urgents</span>
          </div>
          <div className="module36-unpaid-list">
            {!loading && urgentUnpaid.length === 0 && <p style={{ padding: 12 }}>Aucun impayé.</p>}
            {urgentUnpaid.map(item => {
              const badge = getRetardBadge(item.retard)
              return (
                <div key={item.matricule} className="module36-unpaid-card">
                  <div>
                    <div className="module36-unpaid-name">{item.eleve?.prenom} {item.eleve?.nom}</div>
                    <div className="module36-unpaid-class">{item.classe?.libelle}</div>
                  </div>
                  <div className="module36-unpaid-right">
                    <div className="module36-unpaid-days" style={{ color: badge.color }}>{item.retard}j</div>
                    <div className="module36-unpaid-amount">{formatFcfa(item.montantDu)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Module36Layout>
  )
}
