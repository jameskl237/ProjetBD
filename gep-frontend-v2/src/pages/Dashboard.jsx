import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import { dashboardApi } from '../api/dashboard.api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch((e) => setError(e.response?.data?.error || 'Erreur de chargement du tableau de bord'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Chargement du tableau de bord…" />

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

  const monthlyFlowData = stats?.paiements?.monthlyFlow?.length > 0 ? {
    labels: stats.paiements.monthlyFlow.map((m) => m.month),
    datasets: [{
      label: 'FCFA',
      data: stats.paiements.monthlyFlow.map((m) => m.total),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.08)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointBackgroundColor: '#2563eb',
    }],
  } : null

  const performanceData = stats?.performanceByCours?.length > 0 ? {
    labels: stats.performanceByCours.map((c) => c.libelle.length > 12 ? c.libelle.slice(0, 12) + '…' : c.libelle),
    datasets: [{
      label: 'Moyenne /20',
      data: stats.performanceByCours.map((c) => Number(c.moyenne).toFixed(1)),
      backgroundColor: stats.performanceByCours.map((_, i) => COLORS[i % COLORS.length] + 'cc'),
      borderRadius: 6,
    }],
  } : null

  const sectionData = stats?.coursBySection?.length > 0 ? {
    labels: stats.coursBySection.map((s) => s.section),
    datasets: [{
      data: stats.coursBySection.map((s) => s.nb),
      backgroundColor: COLORS.slice(0, stats.coursBySection.length),
    }],
  } : null

  const quickActions = [
    { icon: '👶', label: 'Nouvel élève', to: '/eleves' },
    { icon: '💳', label: 'Paiement', to: '/paiements' },
    { icon: '📋', label: 'Emploi du temps', to: '/emploi-du-temps' },
    { icon: '📊', label: 'Évaluations', to: '/evaluations' },
    { icon: '📝', label: 'Bulletins', to: '/bulletins' },
    { icon: '✉️', label: 'Messages', to: '/messages' },
  ]

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={stats?.annee ? `Année académique ${stats.annee.libelle || ''}` : "Vue d'ensemble de l'établissement"}
      />
      <Alert tone="error">{error}</Alert>

      {stats && (
        <>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 14, marginBottom: 20 }}>
            <StatCard icon="👦" label="Élèves" value={fmt(stats.totals.eleves)} tone="info" />
            <StatCard icon="🎓" label="Enseignants" value={fmt(stats.totals.enseignants)} tone="success" />
            <StatCard icon="🏫" label="Classes" value={fmt(stats.totals.classes)} tone="warning" />
            <StatCard icon="📚" label="Cours" value={fmt(stats.totals.cours)} tone="danger" />
            <StatCard icon="💰" label="Encaissé ce mois" value={`${fmt(stats.paiements.thisMonthTotal)} F`} tone="success" />
            <StatCard icon="🏦" label="Total encaissé" value={`${fmt(stats.paiements.totalEncaisse)} F`} tone="info" />
            <StatCard icon="🚫" label="Absences aujourd'hui" value={fmt(stats.absencesAujourdhui)} tone="danger" />
            <StatCard icon="✉️" label="Messages en attente" value={fmt(stats.messagesEnAttente)} tone="warning" />
          </div>

          {/* ── Charts Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: monthlyFlowData ? '1.6fr 1fr' : '1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
            {monthlyFlowData && (
              <Card>
                <h3 style={{ marginBottom: 10 }}>Flux de paiements (8 mois)</h3>
                <Line data={monthlyFlowData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </Card>
            )}
            {sectionData && (
              <Card>
                <h3 style={{ marginBottom: 10 }}>Cours par section</h3>
                <div style={{ maxWidth: 240, margin: '0 auto' }}>
                  <Doughnut data={sectionData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 12 } } } } }} />
                </div>
              </Card>
            )}
          </div>

          {performanceData && (
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Performance par cours</h3>
              <Bar data={performanceData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 20 } } }} />
            </Card>
          )}

          {/* ── Quick Actions ── */}
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Actions rapides</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {quickActions.map((a) => (
                <button
                  key={a.to}
                  onClick={() => navigate(a.to)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
                    border: '1px solid var(--border-light)', borderRadius: 8, background: 'var(--surface)',
                    cursor: 'pointer', fontSize: 13.5, fontWeight: 500, transition: 'all .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eef4ff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'var(--surface)' }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </Card>

          {/* ── Top students + Teachers ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <h3 style={{ marginBottom: 14 }}>Meilleurs élèves</h3>
              {stats.topStudents.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Aucune évaluation enregistrée.</p>}
              {stats.topStudents.map((s, i) => (
                <div key={s.matricule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS[i % COLORS.length], color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                    {s.nom} {s.prenom}
                  </span>
                  <Badge tone={s.moyenne >= 10 ? 'success' : 'danger'}>{Number(s.moyenne).toFixed(2)}/20</Badge>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ marginBottom: 14 }}>Enseignants</h3>
              {stats.enseignants?.map((e) => (
                <div key={e.nom + e.prenom} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{e.nom} {e.prenom}</span>
                  <Badge tone="info">{e.nbCours} cours</Badge>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Level distribution + Sessions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <h3 style={{ marginBottom: 14 }}>Répartition par classe</h3>
              {stats.levelDistribution.map((l) => (
                <div key={l.classe} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{l.classe}</span>
                  <span style={{ fontWeight: 700 }}>{l.effectif}</span>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ marginBottom: 14 }}>Séances du jour</h3>
              {stats.upcomingSessions.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Aucune séance programmée aujourd'hui.</p>}
              {stats.upcomingSessions.map((s) => (
                <div key={s.idTemps} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{s.cours} — {s.classe}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.heure}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Notices ── */}
          {stats.notices.length > 0 && (
            <Card>
              <h3 style={{ marginBottom: 14 }}>Annonces récentes</h3>
              {stats.notices.map((n) => (
                <div key={n.idMessages} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n.titre}</div>
                  {n.contenu && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{n.contenu.slice(0, 120)}{n.contenu.length > 120 ? '…' : ''}</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{n.auteur || 'Administration'}</div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
