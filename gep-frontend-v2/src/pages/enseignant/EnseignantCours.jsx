import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { enseignantsApi } from '../../api/cours.api'
import { useAuth } from '../../hooks/useAuth'

export default function EnseignantCours() {
  const { user } = useAuth()
  const [mesCours, setMesCours] = useState(null)

  useEffect(() => {
    enseignantsApi.list()
      .then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id)))
      .catch(() => setMesCours([]))
  }, [user])

  const stats = useMemo(() => {
    if (!mesCours) return { total: 0, classes: 0 }
    const classes = new Set(mesCours.map((c) => c.cours?.classe?.idClasse).filter(Boolean)).size
    return { total: mesCours.length, classes }
  }, [mesCours])

  if (mesCours === null) return <Spinner label="Chargement de vos cours…" />

  return (
    <div>
      <PageHeader
        title="Mes cours"
        subtitle={`${stats.total} cours répartis sur ${stats.classes} classe${stats.classes > 1 ? 's' : ''}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📚" label="Total cours" value={stats.total} tone="info" />
        <StatCard icon="🏫" label="Classes" value={stats.classes} tone="warning" />
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Cours</th>
              <th style={thStyle}>Classe</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
            </tr>
          </thead>
          <tbody>
            {mesCours.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun cours affecté.</td></tr>
            )}
            {mesCours.map((c, i) => (
              <tr key={c.idEnseignant} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 700,
                    background: 'var(--accent-light)', color: 'var(--accent)',
                  }}>{i + 1}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 18, background: 'var(--info-light)', flexShrink: 0,
                    }}>📖</span>
                    <span style={{ fontWeight: 600 }}>{c.cours?.libelle || '—'}</span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                    background: 'var(--info-light)', color: 'var(--info)',
                  }}>{c.cours?.classe?.libelle || '—'}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{c.cours?.coefficient || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {stats.total} cours affiché{stats.total > 1 ? 's' : ''}
      </div>
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
