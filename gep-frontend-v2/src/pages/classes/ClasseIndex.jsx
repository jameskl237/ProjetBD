import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function ClasseIndex() {
  const { data, loading, error, reload } = useResource(classesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE
  const [search, setSearch] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [noTitulaire, setNoTitulaire] = useState(false)

  const cycles = useMemo(() => {
    const set = new Set()
    data.forEach((c) => { if (c.cycle?.libelle) set.add(c.cycle.libelle) })
    return [...set].sort()
  }, [data])

  const stats = useMemo(() => {
    const total = data.length
    const totalEleves = data.reduce((s, c) => s + (c.effectif || 0), 0)
    const topClasse = data.length > 0
      ? data.reduce((max, c) => (c.effectif || 0) > (max.effectif || 0) ? c : max, data[0])
      : null
    const sansTitulaire = data.filter((c) => !c.titulaire).length
    return { total, totalEleves, topClasse, sansTitulaire }
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (cycleFilter) {
      result = result.filter((c) => c.cycle?.libelle === cycleFilter)
    }
    if (noTitulaire) {
      result = result.filter((c) => !c.titulaire)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((c) =>
        `${c.libelle} ${c.cycle?.libelle || ''} ${c.titulaire?.nom || ''} ${c.titulaire?.prenom || ''}`.toLowerCase().includes(q)
      )
    }
    return result
  }, [data, search, cycleFilter, noTitulaire])

  async function handleDelete(row) {
    if (!confirm(`Supprimer la classe ${row.libelle} ?`)) return
    await classesApi.remove(row.idClasse)
    reload()
  }

  if (loading) return <Spinner label="Chargement des classes…" />

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle={`${stats.total} classe${stats.total > 1 ? 's' : ''}`}
        actions={isAdmin ? <Link to="/classes/nouvelle"><Button>＋ Nouvelle classe</Button></Link> : null}
      />

      <Alert tone="error">{error}</Alert>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '🏫', label: 'Total classes', value: stats.total, color: 'var(--accent)' },
          stats.topClasse && stats.topClasse.effectif > 0
            ? { icon: '🏆', label: 'Classe la plus peuplée', value: stats.topClasse.libelle, sub: `${stats.topClasse.effectif} élèves`, color: '#f59e0b' }
            : { icon: '👦', label: 'Total élèves', value: stats.totalEleves, color: '#2563eb' },
          stats.sansTitulaire > 0 ? { icon: '👤', label: 'Sans titulaire', value: stats.sansTitulaire, color: '#f59e0b' } : null,
        ].filter(Boolean).map((s) => (
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
              {s.sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.sub}</div>}
            </div>
          </Card>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <Card style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 1 280px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
          <input
            placeholder="Rechercher une classe, cycle, titulaire…"
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

        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            style={{
              padding: '10px 36px 10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--bg)',
              color: cycleFilter ? 'var(--text-primary)' : 'var(--text-muted)',
              appearance: 'none', cursor: 'pointer', fontWeight: cycleFilter ? 600 : 400,
              transition: 'border-color .15s', minWidth: 170,
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">Tous les cycles</option>
            {cycles.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 10,
          }}>▼</span>
        </div>

        {/* Filtre sans titulaire */}
        <button
          onClick={() => setNoTitulaire(!noTitulaire)}
          style={{
            padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13.5, fontWeight: noTitulaire ? 700 : 500,
            border: `1px solid ${noTitulaire ? '#f59e0b' : 'var(--border)'}`,
            background: noTitulaire ? '#f59e0b15' : 'var(--bg)',
            color: noTitulaire ? '#f59e0b' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
          }}
        >
          {noTitulaire ? '✓ ' : ''}Sans titulaire{stats.sansTitulaire > 0 ? ` (${stats.sansTitulaire})` : ''}
        </button>

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
                  { label: 'Classe', width: '20%' },
                  { label: 'Cycle', width: '16%' },
                  { label: 'Titulaire', width: '26%' },
                  { label: 'Effectif', width: '12%' },
                  { label: '', width: '26%' },
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
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    {search || cycleFilter ? 'Aucune classe ne correspond à vos critères' : 'Aucune classe enregistrée'}
                  </td>
                </tr>
              ) : filtered.map((c, i) => {
                const titulaire = c.titulaire
                const tInit = titulaire ? `${(titulaire.prenom?.[0] || '')}${(titulaire.nom?.[0] || '')}`.toUpperCase() : null
                return (
                  <tr
                    key={c.idClasse}
                    style={{
                      borderBottom: '1px solid var(--border-light)', transition: 'background .12s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => window.location.href = `/classes/${c.idClasse}`}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.libelle}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {c.cycle?.libelle ? (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                          background: 'var(--accent-light)', color: 'var(--accent)',
                        }}>
                          {c.cycle.libelle}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {titulaire ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: COLORS[i % COLORS.length], color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {tInit}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{titulaire.nom} {titulaire.prenom}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Non affecté</span>}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                        background: c.effectif > 0 ? '#2563eb15' : 'var(--border-light)',
                        color: c.effectif > 0 ? '#2563eb' : 'var(--text-muted)',
                      }}>
                        {c.effectif || 0}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <Link to={`/classes/${c.idClasse}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }} onClick={(ev) => ev.stopPropagation()}>
                          Voir
                        </Link>
                        {isAdmin && (
                          <Link to={`/classes/${c.idClasse}/modifier`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }} onClick={(ev) => ev.stopPropagation()}>
                            Modifier
                          </Link>
                        )}
                        {isAdmin && (
                          <button onClick={(ev) => { ev.stopPropagation(); handleDelete(c) }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>
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
