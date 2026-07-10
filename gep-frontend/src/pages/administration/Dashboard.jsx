import { useEffect, useState } from 'react'
import StatCard from '../../components/ui/StatCard'
import LineChart from '../../components/ui/LineChart'
import UserMenu from '../../components/layout/UserMenu'
import { dashboardApi } from '../../api'
import useAuth from '../../hooks/useAuth'
import './Dashboard.css'

const MONTH_LABELS = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
  '07': 'Juil', '08': 'Août', '09': 'Sept', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

const LEVEL_COLORS = ['var(--cyan)', 'var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#7C3AED']

function formatMontant(value) {
  return `${Math.round(value ?? 0).toLocaleString('fr-FR')} F`
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const displayName = user?.nom || user?.login || ''

  useEffect(() => {
    let cancelled = false
    dashboardApi.stats()
      .then(({ data }) => { if (!cancelled) setStats(data) })
      .catch(() => { if (!cancelled) setError("Impossible de charger les statistiques du tableau de bord.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const totals = stats?.totals ?? { eleves: 0, enseignants: 0, classes: 0, cours: 0 }
  const monthlyFlow = stats?.paiements?.monthlyFlow ?? []
  const flowLabels = monthlyFlow.map(item => MONTH_LABELS[item.month.slice(5)] ?? item.month)
  const maxLevel = Math.max(1, ...(stats?.levelDistribution ?? []).map(item => item.effectif))

  const topCards = [
    { label: 'Élèves actifs', value: totals.eleves.toLocaleString('fr-FR'), color: 'purple', icon: '🎓' },
    { label: 'Enseignants actifs', value: totals.enseignants.toLocaleString('fr-FR'), color: 'cyan', icon: '🧑‍🏫' },
    { label: 'Classes', value: totals.classes.toLocaleString('fr-FR'), color: 'green', icon: '🏫' },
    { label: 'Cours', value: totals.cours.toLocaleString('fr-FR'), color: 'orange', icon: '📚' },
  ]

  return (
    <div>
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div />
          <div className="dashboard-topbar-right">
            <UserMenu />
          </div>
        </header>

        <main className="dashboard-content">
          <section className="dashboard-page-header">
            <div>
              <h1>Bienvenue{displayName ? `, ${displayName}` : ''}. 👋</h1>
              <p>Vue d'ensemble de l'établissement.</p>
            </div>
            <div className="dashboard-header-actions">
              {stats?.annee && <span className="dashboard-chip dashboard-chip-primary">Année active {stats.annee.libelle}</span>}
            </div>
          </section>

          {error && <div className="dashboard-error-banner">{error}</div>}

          <div className="stats-grid dashboard-stat-row">
            {topCards.map(card => (
              <StatCard key={card.label} label={card.label} value={loading ? '…' : card.value} color={card.color} icon={card.icon} />
            ))}
          </div>

          <div className="dashboard-grid dashboard-grid-2 dashboard-finance-grid">
            <section className="card dashboard-section-card dashboard-chart-card dashboard-chart-card-wide dashboard-finance-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Encaissements de frais (8 derniers mois)</span>
              </div>
              <div className="dashboard-chart-frame">
                {monthlyFlow.length === 0 ? (
                  <p className="dashboard-empty-note">Aucun paiement enregistré sur la période.</p>
                ) : (
                  <LineChart
                    labels={flowLabels}
                    datasets={[
                      {
                        label: 'Encaissements mensuels',
                        data: monthlyFlow.map(item => item.total),
                        backgroundColor: 'rgba(6,182,212,0.10)',
                        borderColor: 'var(--cyan)',
                        tension: 0.42,
                        fill: true,
                      },
                    ]}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.18)' } },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                )}
              </div>
            </section>

            <section className="card dashboard-section-card dashboard-fees-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Encaissements ce mois-ci</span>
              </div>
              <div className="dashboard-metrics-list">
                <div className="dashboard-metric-item">
                  <div>
                    <p className="dashboard-metric-label">Total encaissé</p>
                    <p className="dashboard-metric-note">Mois en cours</p>
                  </div>
                  <strong className="dashboard-metric-value">{formatMontant(stats?.paiements?.thisMonthTotal)}</strong>
                </div>
                <div className="dashboard-metric-item">
                  <div>
                    <p className="dashboard-metric-label">Messages en attente de validation</p>
                    <p className="dashboard-metric-note">À traiter par le secrétariat</p>
                  </div>
                  <strong className="dashboard-metric-value">{stats?.messagesEnAttente ?? 0}</strong>
                </div>
              </div>
            </section>
          </div>

          <div className="dashboard-grid dashboard-grid-2 dashboard-grid-top-gap">
            <section className="card dashboard-section-card dashboard-table-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Meilleurs élèves</span>
              </div>
              <div className="table-wrap dashboard-table-wrap">
                {(stats?.topStudents ?? []).length === 0 ? (
                  <p className="dashboard-empty-note">Aucune évaluation enregistrée pour le moment.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Matricule</th>
                        <th>Moyenne</th>
                        <th>Évaluations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topStudents.map(student => (
                        <tr key={student.matricule}>
                          <td>
                            <div className="student-cell">
                              <div className="stu-avatar">{(student.prenom?.[0] ?? '').toUpperCase()}{(student.nom?.[0] ?? '').toUpperCase()}</div>
                              {student.prenom} {student.nom}
                            </div>
                          </td>
                          <td><span className="id-badge">{student.matricule}</span></td>
                          <td>{student.moyenne.toFixed(1)}/20</td>
                          <td>{student.nbEvaluations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="card dashboard-section-card dashboard-announcements-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Derniers messages validés</span>
              </div>
              <div className="dashboard-notice-list">
                {(stats?.notices ?? []).length === 0 ? (
                  <p className="dashboard-empty-note">Aucun message validé pour le moment.</p>
                ) : (
                  stats.notices.map(item => (
                    <div key={item.idMessages} className="dashboard-notice-item">
                      <div className="dashboard-notice-icon">📌</div>
                      <div className="dashboard-notice-content">
                        <p className="dashboard-notice-title">{item.titre || item.contenu}</p>
                        <p className="dashboard-notice-meta">{item.auteur ? `${item.auteur} · ` : ''}{formatDate(item.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="dashboard-grid dashboard-grid-2 dashboard-grid-bottom-gap">
            <section className="card dashboard-section-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Répartition des élèves par classe</span>
              </div>
              <div className="dashboard-level-list">
                {(stats?.levelDistribution ?? []).length === 0 ? (
                  <p className="dashboard-empty-note">Aucune inscription enregistrée pour l'année active.</p>
                ) : (
                  stats.levelDistribution.map((item, index) => (
                    <div key={item.classe} className="dashboard-level-row">
                      <div className="dashboard-level-labels">
                        <span className="dashboard-level-name">{item.classe}</span>
                        <span className="dashboard-level-count">{item.effectif} élèves</span>
                      </div>
                      <div className="dashboard-level-bar">
                        <div className="dashboard-level-fill" style={{ width: `${(item.effectif / maxLevel) * 100}%`, background: LEVEL_COLORS[index % LEVEL_COLORS.length] }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card dashboard-section-card dashboard-classes-card">
              <div className="card-header dashboard-card-header">
                <span className="card-title">Moyenne par matière</span>
              </div>
              <div className="dashboard-performance-list">
                {(stats?.performanceByCours ?? []).length === 0 ? (
                  <p className="dashboard-empty-note">Aucune évaluation enregistrée pour le moment.</p>
                ) : (
                  stats.performanceByCours.map(row => (
                    <div key={row.idCours} className="perf-row">
                      <div className="perf-meta">
                        <span className="perf-class">{row.libelle}</span>
                        <span className="perf-pct">{row.moyenne.toFixed(1)}/20</span>
                      </div>
                      <div className="perf-bar-wrap">
                        <div className="perf-bar bar-violet" style={{ width: `${(row.moyenne / 20) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="card dashboard-section-card dashboard-reminders-card">
            <div className="dashboard-section-header">
              <div>
                <p className="dashboard-section-kicker">Aujourd'hui</p>
                <h2 className="activities-title">Séances programmées</h2>
              </div>
            </div>
            <div className="dashboard-reminder-list">
              {(stats?.upcomingSessions ?? []).length === 0 ? (
                <p className="dashboard-empty-note">Aucune séance programmée aujourd'hui.</p>
              ) : (
                stats.upcomingSessions.map(session => (
                  <div key={session.idTemps} className="dashboard-reminder-item">
                    <span className="dashboard-reminder-dot success" />
                    <div>
                      <p className="dashboard-reminder-title">{session.heure} — {session.cours}</p>
                      <p className="dashboard-reminder-text">Classe {session.classe}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
