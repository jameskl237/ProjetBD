import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { enseignantsApi, enseignantDashboardApi } from '../../api/cours.api'
import { useAuth } from '../../hooks/useAuth'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend)

const PIE_COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#10b981']

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

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

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const [mesCours, setMesCours] = useState(null)
  const [stats, setStats] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    enseignantsApi.list().then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id))).catch(() => setMesCours([]))
    enseignantDashboardApi.get().then(setStats).catch(() => setStats(null))
  }, [user])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const pieData = useMemo(() => {
    if (!stats?.repartitionNotes?.length) return null
    const total = stats.repartitionNotes.reduce((s, r) => s + r.count, 0)
    if (total === 0) return null
    return {
      labels: stats.repartitionNotes.map((r) => r.tranche),
      datasets: [{
        data: stats.repartitionNotes.map((r) => r.count),
        backgroundColor: PIE_COLORS.slice(0, stats.repartitionNotes.length),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    }
  }, [stats])

  if (mesCours === null || stats === null) return <Spinner label="Chargement de votre espace…" />

  const nombreClasses = new Set(mesCours.map((c) => c.cours?.classe?.idClasse).filter(Boolean)).size

  const jourActuel = now.getDay()
  const moisActuel = now.getMonth()
  const anneeActuelle = now.getFullYear()
  const joursDansMois = new Date(anneeActuelle, moisActuel + 1, 0).getDate()
  const premierJour = new Date(anneeActuelle, moisActuel, 1).getDay()
  const casesCalendrier = []
  for (let i = 0; i < premierJour; i++) casesCalendrier.push(null)
  for (let j = 1; j <= joursDansMois; j++) casesCalendrier.push(j)

  const eleves = stats.elevesTitulaire || []
  const messages = stats.messages || []

  return (
    <div>
      <PageHeader title={`Bienvenue, ${user?.nom || ''}`} subtitle="Votre espace enseignant" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard icon="📚" label="Cours assurés" value={mesCours.length} tone="info" />
        <StatCard icon="👨‍🎓" label="Élèves (ma classe)" value={stats.nombreElevesTitulaire} tone="success" hint={stats.classeTitulaire?.libelle || 'Aucune classe titulaire'} />
        <StatCard icon="🏫" label="Classes enseignées" value={nombreClasses} tone="warning" />

        <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
            background: 'var(--info-light)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, flexShrink: 0,
          }}>
            {stats.profile?.photoURL
              ? <img src={stats.profile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (stats.profile?.prenom?.[0] || stats.profile?.nom?.[0] || '?')
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Mon profil</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stats.profile?.prenom || ''} {stats.profile?.nom || ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stats.profile?.login || ''} · {stats.profile?.email || '—'}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row : Mes cours + Pie chart + Calendrier ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>

        {/* ── Mes cours (large) ── */}
        <Card style={{ flex: '4 4 0%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Mes cours</h3>
            {mesCours.length > 5 && (
              <Link to="/enseignant/cours" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Voir tous ({mesCours.length}) →
              </Link>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {mesCours.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Aucun cours affecté.</p>}
            {mesCours.slice(0, 6).map((c) => (
              <div key={c.idEnseignant} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                borderRadius: 'var(--radius-sm)', marginBottom: 4,
                background: 'var(--border-light)', fontSize: 13,
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, background: 'var(--accent-light)', flexShrink: 0,
                }}>📖</span>
                <div style={{ minWidth: 0, flex: 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.cours?.libelle || '—'}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                  background: 'var(--info-light)', color: 'var(--info)', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{c.cours?.classe?.libelle || '—'}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Pie chart : Répartition des notes ── */}
        <Card style={{ flex: '4 4 0%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Répartition des notes</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {stats.classeTitulaire ? `Classe ${stats.classeTitulaire.libelle}` : 'Aucune classe titulaire'}
          </p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
            {pieData ? (
              <Doughnut
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '55%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 11 } } },
                  },
                }}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune note saisie</p>
            )}
          </div>
        </Card>

        {/* ── Calendrier ── */}
        <Card style={{ flex: '2 2 0%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>
            {MOIS_FR[moisActuel]} {anneeActuelle}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {JOURS_FR[jourActuel]} {now.getDate()} {MOIS_FR[moisActuel]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 0' }}>{d}</div>
            ))}
            {casesCalendrier.map((jour, i) => (
              <div key={i} style={{
                fontSize: 12, padding: '5px 0', borderRadius: 6,
                fontWeight: jour === now.getDate() ? 700 : 400,
                background: jour === now.getDate() ? 'var(--accent)' : 'transparent',
                color: jour === now.getDate() ? '#fff' : (jour === null ? 'transparent' : 'var(--text-primary)'),
              }}>
                {jour ?? ''}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row : Élèves (70-80%) + Messages (20-30%) ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>

        {/* ── Table des élèves de la classe titulaire ── */}
        <Card style={{ flex: '13 13 0%', minWidth: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Élèves de ma classe</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {stats.classeTitulaire ? `${stats.classeTitulaire.libelle} — ${eleves.length} élève${eleves.length > 1 ? 's' : ''}` : 'Aucune classe titulaire'}
              </p>
            </div>
            {eleves.length > 5 && (
              <Link to="/eleves" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                Voir tous ({eleves.length}) →
              </Link>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Nom</th>
                  <th style={thStyle}>Prénom</th>
                  <th style={thStyle}>Sexe</th>
                </tr>
              </thead>
              <tbody>
                {eleves.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun élève inscrit.</td></tr>
                )}
                {eleves.slice(0, 5).map((el, i) => (
                  <tr key={el.matricule} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={tdStyle}>
                      <span style={{
                        width: 24, height: 24, borderRadius: 6, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        background: 'var(--accent-light)', color: 'var(--accent)',
                      }}>{i + 1}</span>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{el.nom || '—'}</span></td>
                    <td style={tdStyle}>{el.prenom || '—'}</td>
                    <td style={tdStyle}>{el.sexe === 1 ? 'M' : el.sexe === 2 ? 'F' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Derniers messages ── */}
        <Card style={{ flex: '7 7 0%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Messages récents</h3>
            <Link to="/annonces" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {messages.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Aucun message.</p>}
            {messages.map((m) => (
              <div key={m.idMessages} style={{
                padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 6,
                background: m.isRead ? 'var(--border-light)' : 'var(--accent-light)',
                borderLeft: m.isRead ? '3px solid var(--border)' : '3px solid var(--accent)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.objet || 'Sans objet'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.information || ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {timeAgo(m.created_at)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row : Évaluations + Emploi du temps + Heures ── */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'stretch' }}>

        {/* ── Évaluations récentes ── */}
        <Card style={{ flex: '4 4 0%', minWidth: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Évaluations récentes</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {stats.evaluationsRecentes?.length || 0} évaluation{(stats.evaluationsRecentes?.length || 0) > 1 ? 's' : ''}
              </p>
            </div>
            {(stats.evaluationsRecentes?.length || 0) > 5 && (
              <Link to="/notes" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                Voir toutes →
              </Link>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Élève</th>
                  <th style={thStyle}>Cours</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Note</th>
                  <th style={thStyle}>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {(stats.evaluationsRecentes || []).length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune évaluation.</td></tr>
                )}
                {(stats.evaluationsRecentes || []).slice(0, 5).map((ev) => (
                  <tr key={ev.idEval} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={tdStyle}><span style={{ fontWeight: 600 }}>{ev.prenomEleve || ''} {ev.nomEleve || ''}</span></td>
                    <td style={tdStyle}>{ev.coursLibelle || '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12,
                        background: ev.note >= 10 ? 'var(--success-light)' : ev.note >= 8 ? 'var(--warning-light)' : 'var(--danger-light)',
                        color: ev.note >= 10 ? 'var(--success)' : ev.note >= 8 ? 'var(--warning)' : 'var(--danger)',
                      }}>{Number(ev.note).toFixed(1)}</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--text-secondary)' }}>{ev.appreciation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Emploi du temps ── */}
        <Card style={{ flex: '3 3 0%', minWidth: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 15 }}>Emploi du temps</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {(stats.emploiDuTemps || []).length} créneau{(stats.emploiDuTemps || []).length > 1 ? 'x' : ''}
              </p>
            </div>
            {(stats.emploiDuTemps?.length || 0) > 5 && (
              <Link to="/emploi-du-temps" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                Voir tout →
              </Link>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Jour</th>
                  <th style={thStyle}>Heure</th>
                  <th style={thStyle}>Cours</th>
                  <th style={thStyle}>Classe</th>
                </tr>
              </thead>
              <tbody>
                {(stats.emploiDuTemps || []).length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun créneau.</td></tr>
                )}
                {(stats.emploiDuTemps || []).slice(0, 5).map((edt, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--accent-light)', color: 'var(--accent)',
                      }}>{edt.jour}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{edt.heure}</td>
                    <td style={tdStyle}>{edt.coursLibelle || '—'}</td>
                    <td style={tdStyle}>{edt.classeLibelle || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── Bar chart : Heures de travail ── */}
        <Card style={{ flex: '3 3 0%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Heures de travail</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Créneaux par jour</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
            {(stats.heuresParJour || []).some((j) => j.heures > 0) ? (
              <Bar
                data={{
                  labels: stats.heuresParJour.map((j) => j.jour.slice(0, 3)),
                  datasets: [{
                    label: 'Créneaux',
                    data: stats.heuresParJour.map((j) => j.heures),
                    backgroundColor: stats.heuresParJour.map((j, i) => j.heures > 0 ? '#4C1D95' : '#E5E7EB'),
                    borderRadius: 6,
                    barPercentage: 0.6,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: 'var(--border-light)' } },
                    x: { ticks: { font: { size: 11 } }, grid: { display: false } },
                  },
                }}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun créneau planifié</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

const thStyle = { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '9px 14px', verticalAlign: 'middle' }
