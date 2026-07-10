import { useEffect, useState } from 'react'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import { dashboardApi } from '../api/dashboard.api'

// Tableau de bord Administrateur — reflète exactement la forme de réponse
// de GET /dashboard/stats (voir gep-backend/src/routes/dashboard.ts).
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch((e) => setError(e.response?.data?.error || 'Erreur de chargement du tableau de bord'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner label="Chargement du tableau de bord…" />

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={stats?.annee ? `Année académique ${stats.annee.libelle || ''}` : 'Vue d\'ensemble de l\'établissement'}
      />
      <Alert tone="error">{error}</Alert>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard icon="👦" label="Élèves" value={stats.totals.eleves} tone="info" />
            <StatCard icon="🎓" label="Enseignants" value={stats.totals.enseignants} tone="success" />
            <StatCard icon="🏫" label="Classes" value={stats.totals.classes} tone="warning" />
            <StatCard icon="📚" label="Cours" value={stats.totals.cours} tone="danger" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard icon="💳" label="Encaissé ce mois" value={`${stats.paiements.thisMonthTotal.toLocaleString('fr-FR')} FCFA`} tone="success" />
            <StatCard icon="✉️" label="Messages en attente" value={stats.messagesEnAttente} tone="warning" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
            <Card>
              <h3 style={{ marginBottom: 14 }}>Meilleurs élèves</h3>
              {stats.topStudents.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Aucune évaluation enregistrée.</p>}
              {stats.topStudents.map((s) => (
                <div key={s.matricule} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{s.nom} {s.prenom}</span>
                  <Badge tone={s.moyenne >= 10 ? 'success' : 'danger'}>{Number(s.moyenne).toFixed(2)}/20</Badge>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ marginBottom: 14 }}>Répartition par classe</h3>
              {stats.levelDistribution.map((l) => (
                <div key={l.classe} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                  <span>{l.classe}</span>
                  <span style={{ fontWeight: 700 }}>{l.effectif}</span>
                </div>
              ))}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
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

            <Card>
              <h3 style={{ marginBottom: 14 }}>Annonces récentes</h3>
              {stats.notices.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Aucune annonce publiée.</p>}
              {stats.notices.map((n) => (
                <div key={n.idMessages} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n.titre}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{n.auteur || 'Administration'}</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
