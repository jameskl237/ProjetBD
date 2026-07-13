import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffJ = Math.floor(diffH / 24)
  return `il y a ${diffJ}j`
}

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
          <div style={{ display: 'grid', gridTemplateColumns: monthlyFlowData ? '1.6fr 1fr' : '1fr', gap: 16, marginBottom: 16 }}>
            {monthlyFlowData && (
              <Card>
                <h3 style={{ marginBottom: 10 }}>Flux de paiements (8 mois)</h3>
                <Line data={monthlyFlowData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </Card>
            )}
            {sectionData && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h3 style={{ marginBottom: 10 }}>Cours par section</h3>
                <div style={{ maxWidth: 300, width: '100%' }}>
                  <Doughnut data={sectionData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 12 } } } } }} />
                </div>
              </Card>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: performanceData ? '3fr 2fr' : '1fr', gap: 16, marginBottom: 16 }}>
            {performanceData && (
              <Card>
                <h3 style={{ marginBottom: 10 }}>Performance par cours</h3>
                <Bar data={performanceData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 20 } } }} />
              </Card>
            )}
            {stats.notices.length > 0 && (
              <Card style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3>Annonces récentes</h3>
                  <Link to="/annonces" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                    Voir tout →
                  </Link>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.notices.map((n, i) => (
                    <div
                      key={n.idMessages}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                        background: i % 2 === 0 ? 'var(--accent-light)' : 'var(--border-light)',
                        borderLeft: '3px solid var(--accent)',
                        transition: 'background .15s', cursor: 'default',
                      }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = 'rgba(76, 29, 149, 0.22)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = i % 2 === 0 ? 'var(--accent-light)' : 'var(--border-light)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{n.titre}</div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {timeAgo(n.date)}
                        </span>
                      </div>
                      {n.contenu && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                          {n.contenu.slice(0, 140)}{n.contenu.length > 140 ? '…' : ''}
                        </div>
                      )}
                      <div style={{ marginTop: 6 }}>
                        <Badge tone="neutral">{n.auteur || 'Administration'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3>Enseignants</h3>
                <Link to="/enseignants" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                  Voir tous →
                </Link>
              </div>
              {stats.enseignants?.map((e, i) => (
                <div
                  key={e.nom + e.prenom}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px',
                    borderRadius: 'var(--radius-sm)', marginBottom: 4, fontSize: 14,
                    transition: 'background .15s', cursor: 'default',
                  }}
                  onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                  onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: COLORS[i % COLORS.length], color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {(e.prenom?.[0] || '') + (e.nom?.[0] || '')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.nom} {e.prenom}
                    </div>
                  </div>
                  <Badge tone="info">{e.nbCours} cours</Badge>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Level distribution + Sessions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3>Répartition par classe</h3>
                <Link to="/classes" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                  Voir toutes →
                </Link>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {fmt(stats.levelDistribution.reduce((s, l) => s + l.effectif, 0))} élèves au total
              </p>
              {(() => {
                const maxEffectif = Math.max(...stats.levelDistribution.map((l) => l.effectif), 1)
                return stats.levelDistribution.map((l, i) => (
                  <div
                    key={l.classe}
                    style={{
                      padding: '10px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 4,
                      transition: 'background .15s', cursor: 'default',
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{l.classe}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{l.effectif}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border-light)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${(l.effectif / maxEffectif) * 100}%`,
                        background: COLORS[i % COLORS.length],
                        transition: 'width .4s ease',
                      }} />
                    </div>
                  </div>
                ))
              })()}
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>Élèves</h3>
                <Link to="/eleves" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                  Voir tous →
                </Link>
              </div>
              {(() => {
                const genreData = stats.studentsByGenre || []
                const garcons = genreData.find((g) => g.sexe === 1)?.total || 0
                const filles = genreData.find((g) => g.sexe === 2)?.total || 0
                const autres = genreData.filter((g) => g.sexe !== 1 && g.sexe !== 2).reduce((s, g) => s + g.total, 0)
                const total = garcons + filles + autres || stats.totals.eleves
                const pieData = total > 0 ? {
                  labels: autres > 0 ? ['Garçons', 'Filles', 'Non défini'] : ['Garçons', 'Filles'],
                  datasets: [{
                    data: autres > 0 ? [garcons, filles, autres] : [garcons, filles],
                    backgroundColor: autres > 0 ? ['#2563eb', '#ec4899', '#9CA3AF'] : ['#2563eb', '#ec4899'],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 0,
                  }],
                } : null
                return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* ── Pie chart centré ── */}
                    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
                      {pieData ? (
                        <Doughnut
                          data={pieData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            cutout: '68%',
                            plugins: { legend: { display: false }, tooltip: { enabled: true } },
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--border-light)' }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{fmt(total)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>élèves</span>
                      </div>
                    </div>

                    {/* ── Légende + barre en bas ── */}
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#2563eb' }} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Garçons</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>{fmt(garcons)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#ec4899' }} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Filles</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#ec4899' }}>{fmt(filles)}</span>
                        </div>
                        {autres > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#9CA3AF' }} />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Autres</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#9CA3AF' }}>{fmt(autres)}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--border-light)', overflow: 'hidden', display: 'flex' }}>
                        {garcons > 0 && <div style={{ width: `${total > 0 ? (garcons / total) * 100 : 0}%`, background: '#2563eb' }} />}
                        {filles > 0 && <div style={{ width: `${total > 0 ? (filles / total) * 100 : 0}%`, background: '#ec4899' }} />}
                        {autres > 0 && <div style={{ width: `${total > 0 ? (autres / total) * 100 : 0}%`, background: '#9CA3AF' }} />}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
