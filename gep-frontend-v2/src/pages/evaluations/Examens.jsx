import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { sessionsApi, epreuvesApi, naturesApi, epreuveValidationApi } from '../../api/evaluations.api'
import { anneesApi, trimestresApi } from '../../api/annees.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const ACCENT = 'var(--accent)'
const TABS = [
  { key: 'sessions', label: 'Sessions d\'examen', icon: '📋' },
  { key: 'epreuves', label: 'Épreuves', icon: '📝' },
  { key: 'natures', label: 'Natures d\'épreuve', icon: '🏷️' },
]

const NATURE_COLORS = ['#4C1D95', '#0369a1', '#047857', '#b45309', '#be123c']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Examens() {
  const [tab, setTab] = useState('sessions')
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE

  const sessions = useResource(sessionsApi)
  const epreuves = useResource(epreuvesApi)
  const natures = useResource(naturesApi)
  const [trimestres, setTrimestres] = useState([])
  const [annees, setAnnees] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    trimestresApi.list().then(setTrimestres).catch(() => {})
    anneesApi.list().then(setAnnees).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const epreuvesValidees = epreuves.data.filter((e) => e.valider).length
    const epreuvesEnAttente = epreuves.data.filter((e) => !e.valider).length
    const sessionsAVenir = sessions.data.filter((s) => s.date_passage && daysUntil(s.date_passage) > 0).length
    return {
      sessions: sessions.data.length,
      epreuves: epreuves.data.length,
      epreuvesValidees,
      epreuvesEnAttente,
      natures: natures.data.length,
      sessionsAVenir,
    }
  }, [sessions.data, epreuves.data, natures.data])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions.data
    return sessions.data.filter((s) =>
      `${s.libelle} ${s.description || ''} ${s.responsable?.nom || ''} ${s.responsable?.prenom || ''} ${s.trimestre?.libelle || ''}`.toLowerCase().includes(q)
    )
  }, [sessions.data, search])

  const filteredEpreuves = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return epreuves.data
    return epreuves.data.filter((e) =>
      `${e.libelle} ${e.nature?.libelle || ''} ${e.auteur || ''}`.toLowerCase().includes(q)
    )
  }, [epreuves.data, search])

  const filteredNatures = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return natures.data
    return natures.data.filter((n) =>
      `${n.libelle} ${n.description || ''}`.toLowerCase().includes(q)
    )
  }, [natures.data, search])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      if (modal.kind === 'session') {
        const p = {
          libelle: modal.values.libelle,
          description: modal.values.description,
          idTrimestre: Number(modal.values.idTrimestre),
          idPers: user.id,
          date_passage: modal.values.date_passage || undefined,
        }
        if (modal.mode === 'edit') await sessionsApi.update(modal.values.idSession, p)
        else await sessionsApi.create(p)
        sessions.reload()
      } else if (modal.kind === 'epreuve') {
        const p = {
          libelle: modal.values.libelle,
          idNature: Number(modal.values.idNature),
          urlDoc: modal.values.urlDoc,
          auteur: modal.values.auteur,
        }
        if (modal.mode === 'edit') await epreuvesApi.update(modal.values.idEpreuve, p)
        else await epreuvesApi.create(p)
        epreuves.reload()
      } else {
        const p = {
          libelle: modal.values.libelle,
          description: modal.values.description,
          idAnnee: modal.values.idAnnee ? Number(modal.values.idAnnee) : null,
        }
        await naturesApi.create(p)
        natures.reload()
      }
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    }
  }

  async function handleValiderEpreuve(id) {
    try {
      await epreuveValidationApi.valider(id)
      flash('Épreuve validée avec succès')
      epreuves.reload()
    } catch (err) {
      flash(err.response?.data?.error || 'Erreur lors de la validation')
    }
  }

  async function handleRejeterEpreuve(id) {
    try {
      await epreuveValidationApi.rejeter(id)
      flash('Épreuve rejetée')
      epreuves.reload()
    } catch (err) {
      flash(err.response?.data?.error || 'Erreur lors du rejet')
    }
  }

  const loading = sessions.loading || epreuves.loading || natures.loading
  const error = sessions.error || epreuves.error || natures.error

  return (
    <div>
      {/* ── Header ── */}
      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #5b21b6 100%)',
        border: 'none', color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Évaluation
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Gestion des examens
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Sessions, épreuves et suivi des évaluations par période.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)' }}>
              📋 {stats.sessions} sessions
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)' }}>
              📝 {stats.epreuves} épreuves
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)' }}>
              🏷️ {stats.natures} natures
            </span>
          </div>
        </div>
      </Card>

      {message && <Alert tone="info">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {/* ── Tabs + search ── */}
      <Card style={{
        marginBottom: 16, padding: '12px 16px',
        borderTop: `3px solid ${ACCENT}`,
        borderRadius: `0 var(--radius) var(--radius) var(--radius)`,
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch('') }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s ease',
              border: tab === t.key ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 260 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-alt, #f9fafb)',
              transition: 'border-color .15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── SESSIONS ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'sessions' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 14 }}>
              <Button onClick={() => setModal({ mode: 'create', kind: 'session', values: { libelle: '', description: '', idTrimestre: '', date_passage: '' } })}>
                <span style={{ marginRight: 6 }}>＋</span> Nouvelle session
              </Button>
            </div>
          )}

          {sessions.loading ? <Spinner /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {filteredSessions.length === 0 && (
                <Card style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 42, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Aucune session</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {search ? 'Aucune session ne correspond à votre recherche.' : 'Créez une première session d\'examen.'}
                  </div>
                </Card>
              )}
              {filteredSessions.map((s) => {
                const diff = daysUntil(s.date_passage)
                const isPast = diff !== null && diff < 0
                const isSoon = diff !== null && diff >= 0 && diff <= 7
                const epreuvesCount = epreuves.data.filter((e) => e.idSession === s.idSession).length
                return (
                  <Card key={s.idSession} style={{
                    borderTop: `3px solid ${isPast ? 'var(--text-muted)' : isSoon ? 'var(--warning)' : ACCENT}`,
                    borderRadius: `0 var(--radius) var(--radius) var(--radius)`,
                    display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px',
                    transition: 'transform .12s ease, box-shadow .12s ease',
                  }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.10)' }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{s.libelle}</div>
                      {isPast && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--text-muted)', color: '#fff', whiteSpace: 'nowrap' }}>Passée</span>}
                      {isSoon && !isPast && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--warning-light)', color: 'var(--warning)', whiteSpace: 'nowrap' }}>Dans {diff}j</span>}
                      {!isPast && !isSoon && diff !== null && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--success-light)', color: 'var(--success)', whiteSpace: 'nowrap' }}>Dans {diff}j</span>}
                    </div>

                    {s.description && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.description}</div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {s.trimestre?.libelle && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          📅 {s.trimestre.libelle}
                        </span>
                      )}
                      {s.date_passage && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--info-light)', color: 'var(--info)' }}>
                          📆 {new Date(s.date_passage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--warning-light)', color: 'var(--warning)' }}>
                        📝 {epreuvesCount} épreuve{epreuvesCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {s.responsable ? `${s.responsable.nom} ${s.responsable.prenom}` : '—'}
                      </span>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setModal({ mode: 'edit', kind: 'session', values: { idSession: s.idSession, libelle: s.libelle, description: s.description || '', idTrimestre: String(s.idTrimestre || ''), date_passage: s.date_passage?.slice(0, 10) || '' } })}
                            style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', padding: '4px 8px', borderRadius: 6, background: 'var(--accent-light)' }}
                          >Modifier</button>
                          <button
                            onClick={async () => { if (confirm(`Supprimer la session "${s.libelle}" ?`)) { await sessionsApi.remove(s.idSession); sessions.reload() } }}
                            style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', padding: '4px 8px', borderRadius: 6, background: 'var(--danger-light)' }}
                          >Supprimer</button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── ÉPREUVES ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'epreuves' && (
        <div>
          <div style={{ marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button onClick={() => setModal({ mode: 'create', kind: 'epreuve', values: { libelle: '', idNature: '', urlDoc: '', auteur: '' } })}>
              <span style={{ marginRight: 6 }}>＋</span> Nouvelle épreuve
            </Button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden', borderTop: `3px solid ${ACCENT}`, borderRadius: `0 var(--radius) var(--radius) var(--radius)` }}>
            {epreuves.loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Épreuve</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Nature</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Auteur</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Statut</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEpreuves.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                          <div style={{ fontSize: 42, marginBottom: 8 }}>📝</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Aucune épreuve</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {search ? 'Aucune épreuve ne correspond.' : 'Ajoutez une première épreuve.'}
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredEpreuves.map((ep) => {
                      const color = NATURE_COLORS[(ep.idNature || 0) % NATURE_COLORS.length]
                      return (
                        <tr key={ep.idEpreuve} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease' }}
                          onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                          onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{ep.libelle}</div>
                            {ep.urlDoc && (
                              <a href={ep.urlDoc} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                                📎 Document
                              </a>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                              background: color + '18', color, border: `1px solid ${color}30`,
                            }}>
                              {ep.nature?.libelle || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {ep.auteur || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                            <Badge tone={ep.valider ? 'success' : 'warning'}>
                              {ep.valider ? '✓ Validée' : '⏳ En attente'}
                            </Badge>
                          </td>
                          <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {isAdmin && !ep.valider && (
                                <button
                                  onClick={() => handleValiderEpreuve(ep.idEpreuve)}
                                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', padding: '4px 8px', borderRadius: 6, background: 'var(--success-light)' }}
                                >Valider</button>
                              )}
                              {isAdmin && ep.valider && (
                                <button
                                  onClick={() => handleRejeterEpreuve(ep.idEpreuve)}
                                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', padding: '4px 8px', borderRadius: 6, background: 'var(--danger-light)' }}
                                >Rejeter</button>
                              )}
                              <button
                                onClick={() => setModal({ mode: 'edit', kind: 'epreuve', values: { idEpreuve: ep.idEpreuve, libelle: ep.libelle, idNature: String(ep.idNature), urlDoc: ep.urlDoc || '', auteur: ep.auteur || '' } })}
                                style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', padding: '4px 8px', borderRadius: 6, background: 'var(--accent-light)' }}
                              >Modifier</button>
                              {isAdmin && (
                                <button
                                  onClick={async () => { if (confirm(`Supprimer l'épreuve "${ep.libelle}" ?`)) { await epreuvesApi.remove(ep.idEpreuve); epreuves.reload() } }}
                                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', padding: '4px 8px', borderRadius: 6, background: 'var(--danger-light)' }}
                                >Supprimer</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ padding: '8px 14px', fontSize: 12.5, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
              {filteredEpreuves.length} épreuve{filteredEpreuves.length > 1 ? 's' : ''}{search ? ` sur ${epreuves.data.length}` : ''}
              {' · '}
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{stats.epreuvesValidees} validée{stats.epreuvesValidees > 1 ? 's' : ''}</span>
              {' · '}
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{stats.epreuvesEnAttente} en attente</span>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── NATURES ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'natures' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 14 }}>
              <Button onClick={() => setModal({ mode: 'create', kind: 'nature', values: { libelle: '', description: '', idAnnee: '' } })}>
                <span style={{ marginRight: 6 }}>＋</span> Nouvelle nature
              </Button>
            </div>
          )}

          <Card style={{ padding: 0, overflow: 'hidden', borderTop: `3px solid ${ACCENT}`, borderRadius: `0 var(--radius) var(--radius) var(--radius)` }}>
            {natures.loading ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)', width: 48 }}>#</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Libellé</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Description</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Année Acad.</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.24em', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNatures.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                          <div style={{ fontSize: 42, marginBottom: 8 }}>🏷️</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Aucune nature</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Créez un type d'épreuve.</div>
                        </td>
                      </tr>
                    )}
                    {filteredNatures.map((n, i) => (
                      <tr key={n.idNature}
                        style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s ease' }}
                        onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)'}
                        onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            background: NATURE_COLORS[i % NATURE_COLORS.length] + '18',
                            color: NATURE_COLORS[i % NATURE_COLORS.length],
                          }}>{i + 1}</span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{
                            fontWeight: 700, padding: '4px 12px', borderRadius: 999, fontSize: 13,
                            background: NATURE_COLORS[i % NATURE_COLORS.length] + '18',
                            color: NATURE_COLORS[i % NATURE_COLORS.length],
                            border: `1px solid ${NATURE_COLORS[i % NATURE_COLORS.length]}30`,
                          }}>{n.libelle}</span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: 13, color: n.description ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {n.description || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--info-light)', color: 'var(--info)' }}>
                            {n.annee?.libelle || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ padding: '8px 14px', fontSize: 12.5, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)' }}>
              {filteredNatures.length} nature{filteredNatures.length > 1 ? 's' : ''}{search ? ` sur ${natures.data.length}` : ''}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter' : 'Modifier'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
            {modal.kind === 'session' && (
              <>
                <SelectField label="Trimestre" required value={modal.values.idTrimestre} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idTrimestre: e.target.value } }))}
                  options={trimestres.map((t) => ({ value: t.idTrimes, label: t.libelle }))} />
                <InputField label="Date de passage" type="date" value={modal.values.date_passage} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date_passage: e.target.value } }))} />
              </>
            )}
            {modal.kind === 'epreuve' && (
              <>
                <SelectField label="Nature" required value={modal.values.idNature} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idNature: e.target.value } }))}
                  options={natures.data.map((n) => ({ value: n.idNature, label: n.libelle }))} />
                <InputField label="Auteur" value={modal.values.auteur} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, auteur: e.target.value } }))} />
              </>
            )}
            {modal.kind !== 'epreuve' && (
              <>
                <InputField label="Description" value={modal.values.description} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))} />
                <SelectField label="Année académique" value={modal.values.idAnnee || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idAnnee: e.target.value } }))}
                  options={annees.map((a) => ({ value: a.idAnnee, label: a.libelle }))} placeholder="Facultatif" />
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">{modal.mode === 'create' ? 'Créer' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
