import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useResource } from '../../hooks/useResource'
import { elevesApi } from '../../api/eleves.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const PAGE_SIZE = 10

const AVATAR_COLORS = [
  '#4C1D95', '#0891B2', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#2563EB', '#DB2777', '#4F46E5', '#0D9488',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatMatricule(row) {
  const code = row.matriculeCode || String(row.matricule).padStart(8, '0')
  return code.padStart(8, '0')
}

export default function EleveIndex() {
  const { data, loading, error } = useResource(elevesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const [search, setSearch] = useState('')
  const [classeFilter, setClasseFilter] = useState('')
  const [page, setPage] = useState(1)

  const classes = useMemo(() => {
    if (!data) return []
    const set = new Set()
    data.forEach((e) => {
      const cl = e.inscriptions?.[0]?.classe?.libelle
      if (cl) set.add(cl)
    })
    return [...set].sort()
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((e) => `${e.nom} ${e.prenom} ${e.matricule} ${e.matriculeCode}`.toLowerCase().includes(q))
    }
    if (classeFilter) {
      list = list.filter((e) => e.inscriptions?.[0]?.classe?.libelle === classeFilter)
    }
    return list
  }, [data, search, classeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const totalEleves = data ? data.length : 0
  const elevesActifs = data ? data.filter((e) => e.actif).length : 0
  const elevesSansClasse = data ? data.filter((e) => !e.inscriptions?.length).length : 0

  const columns = [
    {
      key: 'avatar', label: '', width: 48,
      render: (r) => {
        const initials = `${(r.nom?.[0] || '').toUpperCase()}${(r.prenom?.[0] || '').toUpperCase()}`
        const bg = getAvatarColor(`${r.nom}${r.prenom}`)
        return (
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {initials}
          </div>
        )
      },
    },
    {
      key: 'nom', label: 'Nom',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600 }}>{r.nom}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{r.prenom}</span>
        </div>
      ),
    },
    {
      key: 'matricule', label: 'Matricule',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{formatMatricule(r)}</span>,
    },
    {
      key: 'classe', label: 'Classe',
      render: (r) => {
        const cl = r.inscriptions?.[0]?.classe?.libelle
        return cl ? <Badge tone="info">{cl}</Badge> : <span style={{ color: 'var(--text-muted)' }}>—</span>
      },
    },
    {
      key: 'actif', label: 'Statut',
      render: (r) => <Badge tone={r.actif ? 'success' : 'neutral'}>{r.actif ? 'Actif' : 'Inactif'}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Élèves"
        subtitle={`${filtered.length} élève(s)`}
        actions={roleKey === ROLES.ADMINISTRATEUR ? <Link to="/eleves/nouveau"><Button>＋ Nouvel élève</Button></Link> : null}
      />
      <Alert tone="error">{error}</Alert>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard icon="🎓" label="Total élèves" value={totalEleves} tone="info" />
        <StatCard icon="✅" label="Élèves actifs" value={elevesActifs} tone="success" />
        <StatCard icon="⚠️" label="Élèves sans classe" value={elevesSansClasse} tone={elevesSansClasse > 0 ? 'warning' : 'success'} />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Rechercher un élève (nom, prénom, matricule)…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ flex: 1, minWidth: 200, maxWidth: 360, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13.5 }}
          />
          <select
            value={classeFilter}
            onChange={(e) => { setClasseFilter(e.target.value); setPage(1) }}
            style={{
              padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              fontSize: 13.5, background: '#fff', color: 'var(--text-primary)', minWidth: 160,
            }}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : paginated.length === 0 ? <EmptyState title="Aucun élève trouvé" /> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} style={{
                        textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)',
                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4,
                      }}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ borderBottom: '1px solid var(--border)' }} />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row, idx) => (
                    <tr key={row.matricule} style={{
                      borderBottom: '1px solid var(--border-light)',
                      background: idx % 2 === 1 ? '#F9FAFB' : '#fff',
                    }}>
                      {columns.map((col) => (
                        <td key={col.key} style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                          {col.render ? col.render(row) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <Link to={`/eleves/${row.matricule}`} style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                          color: 'var(--accent)', textDecoration: 'none', fontSize: 16,
                        }} title="Voir la fiche">
                          👁
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Page {currentPage} / {totalPages} — {filtered.length} résultat(s)
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                      background: currentPage <= 1 ? 'var(--border-light)' : '#fff',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                      color: 'var(--text-primary)',
                    }}
                  >
                    ← Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, border: '1px solid',
                        borderColor: p === currentPage ? 'var(--accent)' : 'var(--border)',
                        background: p === currentPage ? 'var(--accent)' : '#fff',
                        color: p === currentPage ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer', fontWeight: p === currentPage ? 700 : 400, fontSize: 13,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                      background: currentPage >= totalPages ? 'var(--border-light)' : '#fff',
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
