import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { sallesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const ROOM_ICONS = {
  'Réception': '🏠', 'Bureau': '💼', 'Salle de classe': '🏫', 'Labo': '🔬',
  'Bibliothèque': '📚', 'Admin': '📋', 'Sport': '⚽',
}

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function getRoomIcon(position) {
  if (!position) return '🏠'
  const pos = position.toLowerCase()
  if (pos.includes('réception') || pos.includes('accueil')) return '🏠'
  if (pos.includes('bureau') || pos.includes('admin')) return '💼'
  if (pos.includes('labo') || pos.includes('informatique')) return '🔬'
  if (pos.includes('biblio')) return '📚'
  if (pos.includes('sport') || pos.includes('gym')) return '⚽'
  return '🏫'
}

export default function Salles() {
  const { data, loading, error, reload } = useResource(sallesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR
  const [search, setSearch] = useState('')
  const [etatFilter, setEtatFilter] = useState('')

  const positions = useMemo(() => {
    const set = new Set()
    data.forEach((s) => { if (s.position) set.add(s.position) })
    return [...set].sort()
  }, [data])

  const stats = useMemo(() => {
    const total = data.length
    const occupees = data.filter((s) => s.idClasse != null).length
    const libres = total - occupees
    const capaciteTotale = data.reduce((sum, s) => sum + (s.capacite || 0), 0)
    return { total, occupees, libres, capaciteTotale }
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (etatFilter === 'occupees') result = result.filter((s) => s.idClasse != null)
    else if (etatFilter === 'libres') result = result.filter((s) => s.idClasse == null)
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((s) =>
        `${s.libelle} ${s.position || ''} ${s.classe?.libelle || ''}`.toLowerCase().includes(q)
      )
    }
    return result
  }, [data, search, etatFilter])

  async function handleDelete(row) {
    if (!confirm(`Supprimer la salle « ${row.libelle} » ?`)) return
    try {
      await sallesApi.remove(row.idSalle)
      reload()
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible')
    }
  }

  if (loading) return <Spinner label="Chargement des salles…" />

  return (
    <div>
      <PageHeader
        title="Salles"
        subtitle={`${stats.total} salle${stats.total > 1 ? 's' : ''}`}
        actions={isAdmin ? <Link to="/salles/nouvelle"><Button>＋ Nouvelle salle</Button></Link> : null}
      />

      <Alert tone="error">{error}</Alert>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '🏠', label: 'Total salles', value: stats.total, color: 'var(--accent)' },
          { icon: '🟢', label: 'Occupées', value: stats.occupees, color: '#16a34a' },
          { icon: '⚪', label: 'Libres', value: stats.libres, color: '#6b7280' },
          { icon: '📐', label: 'Capacité totale', value: stats.capaciteTotale, color: '#2563eb' },
        ].map((s) => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, background: `${s.color}15`, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <Card style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 1 280px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
          <input
            placeholder="Rechercher une salle, position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--bg)',
              transition: 'border-color .15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Filtre état */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: '', label: 'Toutes' },
            { key: 'occupees', label: '🟢 Occupées' },
            { key: 'libres', label: '⚪ Libres' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setEtatFilter(etatFilter === f.key ? '' : f.key)}
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13.5,
                fontWeight: etatFilter === f.key ? 700 : 500,
                border: `1px solid ${etatFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
                background: etatFilter === f.key ? 'var(--accent-light)' : 'var(--bg)',
                color: etatFilter === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {[
                  { label: 'Salle', width: '22%' },
                  { label: 'Position', width: '22%' },
                  { label: 'Surface', width: '12%' },
                  { label: 'Capacité', width: '12%' },
                  { label: 'État', width: '18%' },
                  { label: '', width: '14%' },
                ].map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '12px 18px', borderBottom: '2px solid var(--border)',
                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: 0.5, width: col.width,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    {search || etatFilter ? 'Aucune salle ne correspond à vos critères' : 'Aucune salle enregistrée'}
                  </td>
                </tr>
              ) : filtered.map((s, i) => {
                const isOccupee = s.idClasse != null
                const icon = getRoomIcon(s.position)
                return (
                  <tr
                    key={s.idSalle}
                    style={{
                      borderBottom: '1px solid var(--border-light)', transition: 'background .12s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => window.location.href = `/salles/${s.idSalle}`}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `${COLORS[i % COLORS.length]}12`, color: COLORS[i % COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>
                          {icon}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{s.libelle}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {s.position || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {s.surface || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {s.capacite ? (
                        <span style={{
                          fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                          background: '#2563eb15', color: '#2563eb',
                        }}>
                          {s.capacite}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {isOccupee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge tone="success">Occupée</Badge>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {s.classe?.libelle || `#${s.idClasse}`}
                          </span>
                        </div>
                      ) : (
                        <Badge tone="neutral">Libre</Badge>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <Link to={`/salles/${s.idSalle}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }} onClick={(ev) => ev.stopPropagation()}>
                          Voir
                        </Link>
                        {isAdmin && (
                          <Link to={`/salles/${s.idSalle}/modifier`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }} onClick={(ev) => ev.stopPropagation()}>
                            Modifier
                          </Link>
                        )}
                        {isAdmin && !isOccupee && (
                          <button onClick={(ev) => { ev.stopPropagation(); handleDelete(s) }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
