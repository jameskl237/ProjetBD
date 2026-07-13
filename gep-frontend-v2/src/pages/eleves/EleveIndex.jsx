import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import { useResource } from '../../hooks/useResource'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function EleveIndex() {
  const { data, loading, error } = useResource(elevesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isDirecteur = roleKey === ROLES.ADMINISTRATEUR

  const [search, setSearch] = useState('')
  const [classeFilter, setClasseFilter] = useState('')

  const classes = useMemo(() => {
    const set = new Set()
    data.forEach((e) => {
      const c = e.inscriptions?.[0]?.classe?.libelle
      if (c) set.add(c)
    })
    return [...set].sort()
  }, [data])

  const stats = useMemo(() => {
    const total = data.length
    const garcons = data.filter((e) => e.sexe === 1).length
    const filles = data.filter((e) => e.sexe === 2).length
    const countByClasse = {}
    data.forEach((e) => {
      const c = e.inscriptions?.[0]?.classe?.libelle
      if (c) countByClasse[c] = (countByClasse[c] || 0) + 1
    })
    const topClasse = Object.entries(countByClasse).sort((a, b) => b[1] - a[1])[0] || null
    return { total, garcons, filles, topClasse }
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (classeFilter) {
      result = result.filter((e) => e.inscriptions?.[0]?.classe?.libelle === classeFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((e) => {
        const parentNom = e.tuteurs?.[0]?.tuteur?.nom || ''
        const parentPrenom = e.tuteurs?.[0]?.tuteur?.prenom || ''
        const quartier = e.quartier?.libelle || ''
        const classe = e.inscriptions?.[0]?.classe?.libelle || ''
        return `${e.nom} ${e.prenom} ${e.matricule} ${e.matriculeCode} ${parentNom} ${parentPrenom} ${quartier} ${classe}`.toLowerCase().includes(q)
      })
    }
    return result
  }, [data, search, classeFilter])

  if (loading) return <Spinner label="Chargement des élèves…" />

  return (
    <div>
      <PageHeader
        title="Élèves"
        subtitle={`${stats.total} élève${stats.total > 1 ? 's' : ''} inscrit${stats.total > 1 ? 's' : ''}`}
        actions={roleKey === ROLES.ADMINISTRATEUR ? (
          <Link to="/eleves/nouveau"><Button>＋ Nouvel élève</Button></Link>
        ) : null}
      />

      <Alert tone="error">{error}</Alert>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '👦', label: 'Total', value: stats.total, color: 'var(--accent)' },
          { icon: '♂️', label: 'Garçons', value: stats.garcons, color: '#2563eb' },
          { icon: '♀️', label: 'Filles', value: stats.filles, color: '#ec4899' },
          stats.topClasse ? { icon: '🏆', label: 'Classe la plus peuplée', value: stats.topClasse[0], sub: `${stats.topClasse[1]} élèves`, color: '#f59e0b' } : null,
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
        {/* Recherche */}
        <div style={{ position: 'relative', flex: '0 1 260px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
          <input
            placeholder="Rechercher par nom ou matricule…"
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

        {/* Filtre classe */}
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <select
            value={classeFilter}
            onChange={(e) => setClasseFilter(e.target.value)}
            style={{
              padding: '10px 36px 10px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13.5, background: 'var(--bg)',
              color: classeFilter ? 'var(--text-primary)' : 'var(--text-muted)',
              appearance: 'none', cursor: 'pointer', fontWeight: classeFilter ? 600 : 400,
              transition: 'border-color .15s',
              minWidth: 170,
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 10,
          }}>▼</span>
        </div>

        {/* Compteur résultats */}
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
                  { label: 'Matricule', width: '12%' },
                  { label: 'Nom', width: '16%' },
                  { label: 'Prénom', width: '20%' },
                  { label: 'Classe', width: '11%' },
                  { label: 'Parent', width: '18%' },
                  { label: 'Sexe', width: '7%' },
                  { label: '', width: '10%' },
                ].map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '12px 18px', borderBottom: '2px solid var(--border)',
                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
                    width: col.width,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    {search || classeFilter ? 'Aucun élève ne correspond à vos critères' : 'Aucun élève inscrit'}
                  </td>
                </tr>
              ) : filtered.map((e, i) => {
                const classe = e.inscriptions?.[0]?.classe?.libelle
                const parent = e.tuteurs?.[0]?.tuteur
                const parentNom = parent ? `${parent.nom || ''} ${parent.prenom || ''}`.trim() : null
                const initials = `${(e.prenom?.[0] || '')}${(e.nom?.[0] || '')}`.toUpperCase()
                return (
                  <tr
                    key={e.matricule}
                    style={{
                      borderBottom: '1px solid var(--border-light)', transition: 'background .12s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                    onClick={() => window.location.href = `/eleves/${e.matricule}`}
                  >
                    <td style={{ padding: '13px 18px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13 }}>
                      {e.matriculeCode || `#${e.matricule}`}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {e.photoURL ? (
                          <img src={e.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: COLORS[i % COLORS.length], color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                          }}>
                            {initials}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontWeight: 500 }}>{e.prenom}</td>
                    <td style={{ padding: '13px 18px' }}>
                      {classe ? (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                          background: 'var(--accent-light)', color: 'var(--accent)',
                        }}>
                          {classe}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: parentNom ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {parentNom || '—'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <Badge tone={e.sexe === 1 ? 'info' : e.sexe === 2 ? 'danger' : 'neutral'}>
                        {e.sexe === 1 ? 'M' : e.sexe === 2 ? 'F' : '—'}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                      <Link
                        to={`/eleves/${e.matricule}`}
                        style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}
                        onClick={(ev) => ev.stopPropagation()}
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
    </div>
  )
}
