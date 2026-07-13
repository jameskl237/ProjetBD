import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const ACCENT = 'var(--accent)'

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
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: ACCENT, marginBottom: 6 }}>
            Pédagogie
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Classes
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 480 }}>
            Gérez les classes, cycles et titulaires de l'établissement.
          </p>
        </div>
        {isAdmin && (
          <Link to="/classes/nouvelle">
            <Button>
              <span style={{ marginRight: 6 }}>＋</span> Nouvelle classe
            </Button>
          </Link>
        )}
      </div>

      <Alert tone="error">{error}</Alert>

      {/* ── Folder panel ── */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '0 var(--radius, 12px) var(--radius, 12px) var(--radius, 12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '26px 28px 30px',
        borderTop: `3px solid ${ACCENT}`,
        minHeight: 300,
      }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.sansTitulaire > 0 ? 4 : 3}, 1fr)`, gap: 14, marginBottom: 22 }}>
          <StatBlock accent="var(--text-primary)" label="Total classes" value={stats.total} note={`${cycles.length} cycle${cycles.length > 1 ? 's' : ''}`} />
          <StatBlock accent="var(--info)" label="Total élèves" value={stats.totalEleves} />
          {stats.topClasse && stats.topClasse.effectif > 0 && (
            <StatBlock accent="#f59e0b" label="Classe la plus peuplée" value={stats.topClasse.libelle} note={`${stats.topClasse.effectif} élèves`} />
          )}
          {stats.sansTitulaire > 0 && (
            <StatBlock accent="#f59e0b" label="Sans titulaire" value={stats.sansTitulaire} />
          )}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 20, marginBottom: 22, borderBottom: '2px dashed var(--border)' }}>
          <SelectField
            placeholder="Tous les cycles"
            options={cycles.map((c) => ({ value: c, label: c }))}
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            style={{ width: 180, marginBottom: 0 }}
          />
          <button
            onClick={() => setNoTitulaire(!noTitulaire)}
            style={{
              padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: noTitulaire ? 700 : 500,
              border: `1px solid ${noTitulaire ? '#f59e0b' : 'var(--border)'}`,
              background: noTitulaire ? 'rgba(245,158,11,0.1)' : 'var(--card-bg)',
              color: noTitulaire ? '#f59e0b' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
            }}
          >
            {noTitulaire ? '✓ ' : ''}Sans titulaire{stats.sansTitulaire > 0 ? ` (${stats.sansTitulaire})` : ''}
          </button>
          <span style={{
            fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
            background: 'var(--border-light)', padding: '5px 12px', borderRadius: 20,
          }}>
            {filtered.length} classe{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="search"
              placeholder="Rechercher une classe, cycle, titulaire…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                border: '1px solid var(--border)', background: 'var(--card-bg)',
                borderRadius: 8, fontSize: 13.5, color: 'var(--text-primary)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {[
                  { label: 'Classe', width: '22%' },
                  { label: 'Cycle', width: '16%' },
                  { label: 'Titulaire', width: '24%' },
                  { label: 'Effectif', width: '12%' },
                  { label: '', width: '26%' },
                ].map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid var(--border)',
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
                  <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      {search || cycleFilter || noTitulaire ? 'Aucune classe ne correspond à vos critères.' : 'Aucune classe enregistrée.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((c, i) => {
                const titulaire = c.titulaire
                const tInit = titulaire ? `${(titulaire.prenom?.[0] || '')}${(titulaire.nom?.[0] || '')}`.toUpperCase() : null
                return (
                  <tr
                    key={c.idClasse}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s', cursor: 'pointer' }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => window.location.href = `/classes/${c.idClasse}`}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.libelle}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.cycle?.libelle ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {c.cycle.libelle}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
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
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: c.effectif > 0 ? 'rgba(37,99,235,0.1)' : 'var(--border-light)',
                        color: c.effectif > 0 ? '#2563eb' : 'var(--text-muted)',
                      }}>
                        {c.effectif || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
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
      </div>
    </div>
  )
}

function StatBlock({ accent, label, value, note }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10,
      padding: '15px 16px', position: 'relative', overflow: 'hidden',
      background: 'var(--card-bg)',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 6px', letterSpacing: 0.2 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 25, margin: 0 }}>{value}</p>
      {note && <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: 'monospace' }}>{note}</p>}
    </div>
  )
}
