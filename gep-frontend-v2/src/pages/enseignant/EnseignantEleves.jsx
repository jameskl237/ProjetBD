import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'

const CLASS_COLORS = ['#4C1D95', '#0369a1', '#047857', '#b45309', '#be123c', '#6d28d9', '#0e7490', '#15803d']
const CLASS_TEXT   = ['#7c3aed', '#0284c7', '#059669', '#d97706', '#e11d48', '#7c3aed', '#0891b2', '#16a34a']

export default function EnseignantEleves() {
  const { user } = useAuth()
  const [eleves, setEleves] = useState(null)
  const [search, setSearch] = useState('')
  const [filterClasse, setFilterClasse] = useState('')

  const reload = useCallback(() => {
    elevesApi.list()
      .then(setEleves)
      .catch(() => setEleves([]))
  }, [])

  useEffect(() => { reload() }, [reload])

  const classes = useMemo(() => {
    if (!eleves) return []
    const map = new Map()
    eleves.forEach((e) => {
      const cl = e.inscriptions?.[0]?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [eleves])

  const filtered = useMemo(() => {
    if (!eleves) return []
    let list = eleves
    if (filterClasse) list = list.filter((e) => e.inscriptions?.some((i) => i.classe?.idClasse === Number(filterClasse)))
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((e) => `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(q))
    return list
  }, [eleves, filterClasse, search])

  const stats = useMemo(() => {
    if (!eleves) return { total: 0, classes: 0, garcons: 0, filles: 0, actifs: 0 }
    const f = filterClasse ? filtered : eleves
    return {
      total: f.length,
      classes: new Set(f.map((e) => e.inscriptions?.[0]?.classe?.idClasse).filter(Boolean)).size,
      garcons: f.filter((e) => e.sexe === 1).length,
      filles: f.filter((e) => e.sexe === 2).length,
      actifs: f.filter((e) => e.actif).length,
    }
  }, [eleves, filtered, filterClasse])

  if (eleves === null) return <Spinner label="Chargement des élèves…" />

  return (
    <div>
      <PageHeader
        title="Mes élèves"
        subtitle={`${eleves.length} élève${eleves.length > 1 ? 's' : ''} répartis dans ${classes.length} classe${classes.length > 1 ? 's' : ''}`}
      />

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="👦" label="Total" value={stats.total} tone="info" />
        <StatCard icon="🏫" label="Classes" value={stats.classes} tone="warning" />
        <StatCard icon="🧑" label="Garçons" value={stats.garcons} tone="success" />
        <StatCard icon="👧" label="Filles" value={stats.filles} tone="info" />
        <StatCard icon="✅" label="Actifs" value={stats.actifs} tone="success" />
      </div>

      {/* ── Search + filter bar ── */}
      <Card style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            placeholder="Rechercher un élève (nom, prénom, matricule)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface-alt, #f9fafb)',
              transition: 'border-color .15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <SelectField
          placeholder="Toutes les classes"
          options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ width: 200, marginBottom: 0 }}
        />
        {(search || filterClasse) && (
          <button
            onClick={() => { setSearch(''); setFilterClasse('') }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
              color: 'var(--danger)', background: 'var(--danger-light)', cursor: 'pointer', border: 'none',
              transition: 'opacity .15s',
            }}
            onMouseDown={(e) => e.currentTarget.style.opacity = '0.75'}
            onMouseUp={(e) => e.currentTarget.style.opacity = '1'}
          >
            ✕ Effacer
          </button>
        )}
      </Card>

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Nom complet</th>
                <th style={thStyle}>Matricule</th>
                <th style={thStyle}>Classe</th>
                <th style={thStyle}>Sexe</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Statut</th>
                <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>Aucun élève trouvé</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                      Essayez de modifier vos filtres ou votre recherche
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((e, i) => {
                const cl = e.inscriptions?.[0]?.classe?.libelle || '—'
                const clIdx = classes.findIndex((c) => c.libelle === cl)
                return (
                  <tr
                    key={e.matricule}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background .12s ease',
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 7, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        background: 'var(--accent-light)', color: 'var(--accent)',
                      }}>{i + 1}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0,
                          background: e.sexe === 2
                            ? 'linear-gradient(135deg, #fce7f3, #fbcfe8)'
                            : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                          color: e.sexe === 2 ? '#be185d' : '#1d4ed8',
                        }}>
                          {(e.nom || '?')[0]}{(e.prenom || '?')[0]}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{e.nom || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.prenom || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 6, background: 'var(--border-light)',
                      }}>{e.matricule}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                        background: clIdx >= 0 ? CLASS_COLORS[clIdx % CLASS_COLORS.length] + '18' : 'var(--info-light)',
                        color: clIdx >= 0 ? CLASS_TEXT[clIdx % CLASS_TEXT.length] : 'var(--info)',
                        border: `1px solid ${clIdx >= 0 ? CLASS_COLORS[clIdx % CLASS_COLORS.length] + '30' : 'transparent'}`,
                      }}>{cl}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500,
                        color: e.sexe === 1 ? 'var(--info)' : 'var(--accent)',
                      }}>
                        {e.sexe === 1 ? '♂' : e.sexe === 2 ? '♀' : '—'}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {e.sexe === 1 ? 'M' : e.sexe === 2 ? 'F' : '—'}
                        </span>
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <Badge tone={e.actif ? 'success' : 'neutral'}>{e.actif ? 'Actif' : 'Inactif'}</Badge>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                      <Link
                        to={`/eleves/${e.matricule}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                          padding: '4px 10px', borderRadius: 6,
                          transition: 'background .12s',
                        }}
                        onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--accent-light)'}
                        onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                      >
                        Voir fiche →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Footer info ── */}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span>
          Affichage de <strong>{filtered.length}</strong> élève{filtered.length > 1 ? 's' : ''}
          {filterClasse ? ` sur ${eleves.length}` : ''}
        </span>
        <span>
          {stats.garcons} garçon{stats.garcons > 1 ? 's' : ''} · {stats.filles} fille{stats.filles > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

const thStyle = { padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
