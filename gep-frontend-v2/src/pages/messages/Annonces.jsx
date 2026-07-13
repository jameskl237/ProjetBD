import { useEffect, useState, useMemo, useRef } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import InputField from '../../components/forms/InputField'
import { useResource } from '../../hooks/useResource'
import { messagesApi } from '../../api/messages.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const CIBLE_OPTIONS = [
  { value: 'parents', label: 'Parents' },
  { value: 'enseignants', label: 'Enseignants' },
  { value: 'tous', label: 'Tous (Parents + Enseignants)' },
]

export default function Annonces() {
  const { data, loading, error, reload } = useResource(messagesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const canCompose = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE || roleKey === ROLES.ENSEIGNANT
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [objet, setObjet] = useState('')
  const [information, setInformation] = useState('')

  const [destTab, setDestTab] = useState('parents')
  const [destMode, setDestMode] = useState('all')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expanded, setExpanded] = useState(null)
  const ddRef = useRef(null)
  const [ddOpen, setDdOpen] = useState(false)
  const [ddSearch, setDdSearch] = useState('')

  useEffect(() => {
    if (!ddOpen) return
    const h = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ddOpen])

  useEffect(() => {
    if (!canCompose) return
    Promise.allSettled([parentsApi.list(), classesApi.list(), coursApi.list?.() ?? coursApi.root?.list?.()]).then(([p, c, e]) => {
      if (p.status === 'fulfilled') setParents(p.value)
      if (c.status === 'fulfilled') setClasses(c.value)
    })
  }, [canCompose])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    if (!objet.trim() || !information.trim()) { setFormError('Remplissez tous les champs'); return }

    try {
      await messagesApi.create({
        cible: modal.values.cible,
        objet: modal.values.objet,
        information: modal.values.information,
      })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'annonce') }
  }

  const filtered = useMemo(() => {
    let list = data || []
    if (search) { const q = search.toLowerCase(); list = list.filter((m) => (m.objet || '').toLowerCase().includes(q) || (m.information || '').toLowerCase().includes(q)) }
    if (dateFilter) { list = list.filter((m) => (m.created_at || '').slice(0, 10) === dateFilter) }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [data, search, dateFilter])

  const stats = useMemo(() => {
    const all = data || []
    return { total: all.length, unread: all.filter((m) => !m.isRead).length, pending: all.filter((m) => !m.valider).length }
  }, [data])

  const summary = getRecipientSummary()

  return (
    <div>
      <PageHeader
        title="Annonces"
        subtitle="Communications entre l'établissement et les familles"
        actions={canCompose ? <Button onClick={() => { setModal({ values: { cible: 'parents', objet: '', information: '' } }); setFormError('') }}>＋ Nouvelle annonce</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'objet', label: 'Objet' },
            { key: 'expediteur', label: 'Expéditeur', render: (r) => r.expediteur ? `${r.expediteur.nom} ${r.expediteur.prenom}` : 'Administration' },
            { key: 'receiverRole', label: 'Destinataire', render: (r) => {
              if (r.receiverRole === 'enseignants') return <Badge tone="info">Enseignants</Badge>
              if (r.receiverRole === 'tous') return <Badge tone="success">Tous</Badge>
              return <Badge tone="warning">Parents</Badge>
            }},
            { key: 'created_at', label: 'Date', render: (r) => r.created_at?.slice(0, 10) },
            { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
            { key: 'isRead', label: 'Lu', render: (r) => <Badge tone={r.isRead ? 'info' : 'neutral'}>{r.isRead ? 'Oui' : 'Non'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idMessages"
          emptyLabel="Aucune annonce"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {!row.isRead && <button onClick={async () => { await messagesApi.marquerLu(row.idMessages); reload() }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Marquer lu</button>}
              {(roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE) && !row.valider && <button onClick={async () => { await messagesApi.valider(row.idMessages); reload() }} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Valider</button>}
              {(roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE) && <button onClick={async () => { if (confirm('Supprimer cette annonce ?')) { await messagesApi.remove(row.idMessages); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
            </div>

            <Alert tone="error">{formError}</Alert>
            <SelectField label="Destinataires" required value={modal.values.cible} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, cible: e.target.value } }))}
              options={CIBLE_OPTIONS} />
            <InputField label="Objet" required value={modal.values.objet} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, objet: e.target.value } }))} />
            <InputField label="Message" required value={modal.values.information} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, information: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Publier l'annonce</Button>
            </div>
          </form>
        )}

        {/* --- Liste des annonces --- */}
        <Card style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Rechercher par titre ou contenu..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchBox} />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }} />
                {dateFilter && <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                <span><strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong> total</span>
                <span><strong style={{ color: '#e74c3c' }}>{stats.unread}</strong> non lu(s)</span>
                {roleKey === ROLES.ADMINISTRATEUR && <span><strong style={{ color: '#f39c12' }}>{stats.pending}</strong> en attente</span>}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: 40 }}><Spinner label="Chargement des annonces…" /></div>
            ) : error ? (
              <div style={{ padding: 20 }}><Alert tone="error">{error}</Alert></div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>
                  {search || dateFilter ? 'Aucune annonce trouvée' : 'Aucune annonce'}
                </div>
                <div style={{ fontSize: 13 }}>
                  {search || dateFilter ? 'Essayez de modifier vos filtres' : 'Les annonces apparaîtront ici'}
                </div>
              </div>
            ) : (
              <div>
                {filtered.map((m, i) => {
                  const isExpanded = expanded === m.idMessages
                  const expName = m.expediteur ? `${m.expediteur.nom} ${m.expediteur.prenom}` : 'Administration'
                  const initials = expName === 'Administration' ? 'AD' : expName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div
                      key={m.idMessages}
                      style={{
                        padding: '16px 20px',
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        background: !m.isRead ? '#f0faf8' : 'transparent',
                        borderLeft: !m.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = !m.isRead ? '#e6f7f4' : 'var(--bg-secondary)' }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = !m.isRead ? '#f0faf8' : 'transparent' }}
                      onClick={() => setExpanded(isExpanded ? null : m.idMessages)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: !m.isRead ? 'linear-gradient(135deg, var(--accent), #0f766e)' : 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
                          color: '#fff', fontSize: 13, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: !m.isRead ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.objet || 'Sans objet'}</span>
                            {!m.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{expName}</span>
                            <span>·</span>
                            <span>{m.created_at?.slice(0, 10) || ''}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {roleKey === ROLES.ADMINISTRATEUR && !m.valider && (
                            <button onClick={(ev) => { ev.stopPropagation(); messagesApi.valider(m.idMessages).then(() => reload()) }}
                              style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid #f39c12', background: '#f39c1222', color: '#e67e22', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              Valider
                            </button>
                          )}
                          <Badge tone={m.valider ? 'success' : 'warning'}>{m.valider ? 'Validée' : 'En attente'}</Badge>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light, var(--border))' }} onClick={(ev) => ev.stopPropagation()}>
                          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{m.information || 'Aucun contenu'}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {!m.isRead && (
                              <button onClick={async () => { await messagesApi.marquerLu(m.idMessages); reload() }}
                                style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Marquer comme lu
                              </button>
                            )}
                            {roleKey === ROLES.ADMINISTRATEUR && (
                              <button onClick={async () => { if (confirm('Supprimer cette annonce ?')) { await messagesApi.remove(m.idMessages); reload() } }}
                                style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
