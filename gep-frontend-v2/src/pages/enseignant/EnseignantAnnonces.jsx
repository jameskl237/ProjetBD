import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { messagesApi } from '../../api/messages.api'
import { useAuth } from '../../hooks/useAuth'

const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

export default function EnseignantAnnonces() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [annRes] = await Promise.allSettled([
        messagesApi.list(),
      ])
      setAnnonces(annRes.status === 'fulfilled' ? annRes.value : [])
    } catch { setError('Erreur lors du chargement') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => {
    let list = annonces
    if (filter === 'unread') list = list.filter((a) => !a.isRead)
    else if (filter === 'read') list = list.filter((a) => a.isRead)
    else if (filter === 'validated') list = list.filter((a) => a.valider)
    else if (filter === 'pending') list = list.filter((a) => !a.valider)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        (a.objet || '').toLowerCase().includes(q) ||
        (a.information || '').toLowerCase().includes(q) ||
        `${a.expediteur?.nom || ''} ${a.expediteur?.prenom || ''}`.toLowerCase().includes(q) ||
        `${a.parent?.personne?.nom || ''} ${a.parent?.personne?.prenom || ''}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [annonces, search, filter])

  const stats = useMemo(() => {
    const total = annonces.length
    const unread = annonces.filter((a) => !a.isRead).length
    const validated = annonces.filter((a) => a.valider).length
    const pending = total - validated
    return { total, unread, validated, pending }
  }, [annonces])

  async function handleMarkRead(id) {
    try { await messagesApi.marquerLu(id); await loadData() } catch {}
  }

  if (loading) return <div><PageHeader title="Annonces" subtitle="Messagerie et communications" /><Spinner label="Chargement des annonces…" /></div>

  const FILTERS = [
    { key: 'all', label: 'Toutes', count: stats.total },
    { key: 'unread', label: 'Non lues', count: stats.unread },
    { key: 'pending', label: 'En attente', count: stats.pending },
    { key: 'validated', label: 'Validées', count: stats.validated },
  ]

  return (
    <div>
      <PageHeader
        title="Annonces"
        subtitle="Messagerie et communications"
        actions={<Button onClick={() => navigate('/enseignant/annonces/nouvelle')}>+ Nouvelle annonce</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        border: 'none', color: '#fff', boxShadow: '0 16px 40px rgba(109, 40, 217, 0.20)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Messagerie enseignant
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Envoyez et suivez vos annonces
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Consultez les communications, marquez-les comme lues et envoyez de nouveaux messages aux parents.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={pillStyle}>✉️ {stats.total} annonce{stats.total > 1 ? 's' : ''}</span>
            <span style={pillStyle}>🔴 {stats.unread} non lue{stats.unread > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <input
              type="text"
              placeholder="Rechercher par objet, contenu, expéditeur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all .15s ease', border: 'none',
                background: filter === f.key ? 'var(--accent)' : 'var(--border-light)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                  fontSize: 10, fontWeight: 800,
                  background: filter === f.key ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)',
                  color: filter === f.key ? '#fff' : '#fff',
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="✉️" label="Total" value={stats.total} tone="info" />
        <StatCard icon="🔴" label="Non lues" value={stats.unread} tone="danger" />
        <StatCard icon="⏳" label="En attente" value={stats.pending} tone="warning" />
        <StatCard icon="✅" label="Validées" value={stats.validated} tone="success" />
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 64, textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>&#128231;</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune annonce</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {search || filter !== 'all' ? 'Aucune annonce ne correspond à votre recherche.' : "Aucune annonce pour le moment."}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((a) => {
            const isExpanded = expandedId === a.idMessages
            const isUnread = !a.isRead
            return (
              <Card
                key={a.idMessages}
                style={{
                  padding: 0, overflow: 'hidden', cursor: 'pointer',
                  border: isUnread ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'all .15s ease',
                }}
                onClick={() => setExpandedId(isExpanded ? null : a.idMessages)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px' }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    background: isUnread ? 'var(--accent-light)' : 'var(--border-light)',
                    color: isUnread ? 'var(--accent)' : 'var(--text-muted)',
                  }}>{isUnread ? '✉️' : '📩'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {a.objet || 'Sans objet'}
                      </span>
                      {isUnread && (
                        <span style={{
                          width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', flexShrink: 0,
                        }} />
                      )}
                      {a.valider ? (
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: '#d1fae5', color: '#065f46' }}>Validée</span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>En attente</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>De : <strong>{a.expediteur ? `${a.expediteur.nom} ${a.expediteur.prenom}` : 'Administration'}</strong></span>
                      <span>À : <strong>{a.parent?.personne ? `${a.parent.personne.nom} ${a.parent.personne.prenom}` : '—'}</strong></span>
                      <span>{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    {!isExpanded && a.information && (
                      <div style={{
                        fontSize: 13, color: 'var(--text-secondary)', marginTop: 6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 600,
                      }}>
                        {a.information}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!a.isRead && (
                      <button
                        onClick={() => handleMarkRead(a.idMessages)}
                        style={{
                          padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: '1px solid var(--border)', background: '#fff', color: 'var(--accent)',
                        }}
                      >Marquer lu</button>
                    )}
                  </div>
                </div>

                {isExpanded && a.information && (
                  <div style={{
                    padding: '0 20px 16px 74px', fontSize: 14, color: 'var(--text-primary)',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  }}>
                    {a.information}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
