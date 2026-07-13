import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { messagesApi } from '../../api/messages.api'
import { classesApi } from '../../api/classes.api'
import { parentsApi } from '../../api/parents.api'
import { enseignantsApi } from '../../api/cours.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const ACCENT = 'var(--accent)'

const TARGET_OPTIONS = [
  { value: 'all_parents', label: 'Tous les parents' },
  { value: 'class_parents', label: 'Parents d\'une classe' },
  { value: 'specific_parents', label: 'Parent(s) spécifique(s)' },
  { value: 'all_enseignants', label: 'Tous les enseignants' },
  { value: 'class_enseignants', label: 'Enseignants d\'une classe' },
  { value: 'specific_enseignants', label: 'Enseignant(s) spécifique(s)' },
  { value: 'all', label: 'Tout le monde' },
]

export default function Annonces() {
  const { data, loading, error, reload } = useResource(messagesApi)
  const classes = useResource(classesApi)
  const allParents = useResource(parentsApi)
  const allEnseignants = useResource(enseignantsApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const canCompose = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE || roleKey === ROLES.ENSEIGNANT

  const [objet, setObjet] = useState('')
  const [information, setInformation] = useState('')
  const [target, setTarget] = useState('all_parents')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [personSearch, setPersonSearch] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [sending, setSending] = useState(false)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expanded, setExpanded] = useState(null)

  const needClasse = target === 'class_parents' || target === 'class_enseignants'
  const needPersons = target === 'specific_parents' || target === 'specific_enseignants'

  useEffect(() => {
    setSelectedIds([])
    setSelectedClasse('')
    setPersonSearch('')
  }, [target])

  const personList = useMemo(() => {
    if (target === 'specific_parents') {
      return (allParents.data || []).map((p) => ({
        id: p.idParent || p.idPers,
        label: `${p.nom || ''} ${p.prenom || ''}`.trim(),
        sub: p.email || '',
      }))
    }
    if (target === 'specific_enseignants') {
      const seen = new Set()
      return (allEnseignants.data || []).reduce((acc, e) => {
        const id = e.personne?.idPers || e.idPers
        if (!id || seen.has(id)) return acc
        seen.add(id)
        acc.push({
          id,
          label: `${e.personne?.nom || e.nom || ''} ${e.personne?.prenom || e.prenom || ''}`.trim(),
          sub: e.personne?.email || e.email || '',
        })
        return acc
      }, [])
    }
    return []
  }, [target, allParents.data, allEnseignants.data])

  const filteredPersons = useMemo(() => {
    if (!personSearch.trim()) return personList
    const q = personSearch.toLowerCase()
    return personList.filter((p) => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q))
  }, [personList, personSearch])

  function togglePerson(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function selectAllPersons() {
    setSelectedIds(filteredPersons.map((p) => p.id))
  }

  async function handleSend(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    if (!objet.trim()) { setFormError('L\'objet est obligatoire'); return }
    if (!information.trim()) { setFormError('Le message est obligatoire'); return }

    let apiTarget, idClasse, ids
    if (target === 'all_parents') { apiTarget = 'parents' }
    else if (target === 'class_parents') {
      if (!selectedClasse) { setFormError('Sélectionnez une classe'); return }
      apiTarget = 'parents'; idClasse = Number(selectedClasse)
    } else if (target === 'specific_parents') {
      if (selectedIds.length === 0) { setFormError('Sélectionnez au moins un parent'); return }
      apiTarget = 'parents'; ids = selectedIds
    } else if (target === 'all_enseignants') { apiTarget = 'enseignants' }
    else if (target === 'class_enseignants') {
      if (!selectedClasse) { setFormError('Sélectionnez une classe'); return }
      apiTarget = 'enseignants'; idClasse = Number(selectedClasse)
    } else if (target === 'specific_enseignants') {
      if (selectedIds.length === 0) { setFormError('Sélectionnez au moins un enseignant'); return }
      apiTarget = 'enseignants'; ids = selectedIds
    } else if (target === 'all') { apiTarget = 'all' }

    try {
      setSending(true)
      await messagesApi.broadcast({ target: apiTarget, idClasse, ids, objet: objet.trim(), information: information.trim() })
      setFormSuccess('Annonce envoyée avec succès')
      setObjet(''); setInformation(''); setSelectedIds([]); setPersonSearch('')
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const filtered = useMemo(() => {
    let list = data || []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => (m.objet || '').toLowerCase().includes(q) || (m.information || '').toLowerCase().includes(q))
    }
    if (dateFilter) {
      list = list.filter((m) => (m.created_at || '').slice(0, 10) === dateFilter)
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [data, search, dateFilter])

  const stats = useMemo(() => {
    const all = data || []
    return {
      total: all.length,
      unread: all.filter((m) => !m.isRead).length,
      pending: all.filter((m) => !m.valider).length,
      parents: all.filter((m) => m.receiverRole === 'parents' || m.receiverRole === 'parent').length,
      enseignants: all.filter((m) => m.receiverRole === 'enseignants' || m.receiverRole === 'enseignant').length,
    }
  }, [data])

  return (
    <div>
      {/* ── Header ── */}
      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
        border: 'none', color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Communication
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Annonces
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Envoyez des annonces ciblées aux parents et enseignants.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              📢 {stats.total} annonces
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              👁️ {stats.unread} non lues
            </span>
            {roleKey === ROLES.ADMINISTRATEUR && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                ⏳ {stats.pending} en attente
              </span>
            )}
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: canCompose ? '380px 1fr' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── COMPOSE ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {canCompose && (
          <Card style={{
            borderTop: `3px solid ${ACCENT}`,
            borderRadius: `0 var(--radius) var(--radius) var(--radius)`,
            padding: '20px 20px',
            position: 'sticky', top: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent-light)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18,
              }}>✉️</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Nouvelle annonce</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ciblez vos destinataires</div>
              </div>
            </div>

            <form onSubmit={handleSend}>
              <Alert tone="error">{formError}</Alert>
              {formSuccess && <Alert tone="success">{formSuccess}</Alert>}

              <SelectField
                label="Destinataires"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                options={TARGET_OPTIONS}
              />

              {needClasse && (
                <SelectField
                  label="Classe"
                  required
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  options={(classes.data || []).map((c) => ({ value: c.idClasse, label: c.libelle }))}
                  placeholder="Choisir une classe…"
                />
              )}

              {needPersons && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    {target === 'specific_parents' ? 'Parent(s)' : 'Enseignant(s)'}
                    {selectedIds.length > 0 && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>({selectedIds.length})</span>}
                  </label>
                  <div style={{ position: 'relative', marginBottom: 6 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
                    <input
                      placeholder="Rechercher…"
                      value={personSearch}
                      onChange={(e) => setPersonSearch(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px 7px 30px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface-alt, #f9fafb)',
                      }}
                    />
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    {filteredPersons.length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Aucun résultat</div>
                    )}
                    {filteredPersons.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => togglePerson(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                          cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                          background: selectedIds.includes(p.id) ? 'var(--accent-light)' : 'transparent',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={(ev) => { if (!selectedIds.includes(p.id)) ev.currentTarget.style.background = 'var(--surface-alt, #f9fafb)' }}
                        onMouseLeave={(ev) => { if (!selectedIds.includes(p.id)) ev.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, border: selectedIds.includes(p.id) ? '2px solid var(--accent)' : '2px solid var(--border)',
                          background: selectedIds.includes(p.id) ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', flexShrink: 0,
                        }}>
                          {selectedIds.includes(p.id) && '✓'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                          {p.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sub}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredPersons.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button type="button" onClick={selectAllPersons} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                        Tout sélectionner
                      </button>
                      {selectedIds.length > 0 && (
                        <button type="button" onClick={() => setSelectedIds([])} style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer' }}>
                          Tout désélectionner
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <InputField
                label="Objet"
                required
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                placeholder="Ex: Réunion parents-professeurs"
              />

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Message <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={information}
                  onChange={(e) => setInformation(e.target.value)}
                  placeholder="Contenu de l'annonce…"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', fontSize: 13, resize: 'vertical',
                    background: 'var(--surface-alt, #f9fafb)', lineHeight: 1.5,
                  }}
                />
              </div>

              <Button type="submit" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
                {sending ? '⏳ Envoi…' : '📢 Publier l\'annonce'}
              </Button>
            </form>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── LISTE DES ANNONCES ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Card style={{
          padding: 0, overflow: 'hidden',
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: `0 var(--radius) var(--radius) var(--radius)`,
        }}>
          {/* ── Filters ── */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160, padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt, #f9fafb)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔍</span>
              <input
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text-primary)', flex: 1 }}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0 }}>×</button>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt, #f9fafb)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
              />
              {dateFilter && <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0 }}>×</button>}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong> total</span>
              <span>·</span>
              <span><strong style={{ color: '#e74c3c' }}>{stats.unread}</strong> non lu</span>
              {roleKey === ROLES.ADMINISTRATEUR && (
                <>
                  <span>·</span>
                  <span><strong style={{ color: '#f39c12' }}>{stats.pending}</strong> en attente</span>
                </>
              )}
            </div>
          </div>

          {/* ── Liste ── */}
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40 }}><Spinner label="Chargement des annonces…" /></div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>
                  {search || dateFilter ? 'Aucune annonce trouvée' : 'Aucune annonce'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {search || dateFilter ? 'Essayez de modifier vos filtres' : 'Les annonces apparaîtront ici'}
                </div>
              </div>
            ) : (
              filtered.map((m, i) => {
                const isExpanded = expanded === m.idMessages
                const expName = m.expediteur ? `${m.expediteur.nom} ${m.expediteur.prenom}` : 'Administration'
                const initials = expName === 'Administration' ? 'AD' : expName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                const cibleLabel = m.receiverRole === 'enseignants' || m.receiverRole === 'enseignant'
                  ? { text: 'Enseignants', tone: 'info' }
                  : m.receiverRole === 'tous' || m.receiverRole === 'all'
                    ? { text: 'Tous', tone: 'success' }
                    : { text: 'Parents', tone: 'warning' }

                return (
                  <div
                    key={m.idMessages}
                    style={{
                      padding: '14px 18px',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                      cursor: 'pointer',
                      background: !m.isRead ? '#f0faf8' : 'transparent',
                      borderLeft: !m.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = !m.isRead ? '#e6f7f4' : 'var(--surface-alt, #f9fafb)' }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = !m.isRead ? '#f0faf8' : 'transparent' }}
                    onClick={() => setExpanded(isExpanded ? null : m.idMessages)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: !m.isRead ? 'linear-gradient(135deg, var(--accent), #7c3aed)' : 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
                        color: '#fff', fontSize: 12, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{initials}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: !m.isRead ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {m.objet || 'Sans objet'}
                          </span>
                          {!m.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span>{expName}</span>
                          <span>·</span>
                          <span>{m.created_at?.slice(0, 10) || ''}</span>
                          <span>·</span>
                          <Badge tone={cibleLabel.tone} style={{ fontSize: 10 }}>{cibleLabel.text}</Badge>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {roleKey === ROLES.ADMINISTRATEUR && !m.valider && (
                          <button
                            onClick={(ev) => { ev.stopPropagation(); messagesApi.valider(m.idMessages).then(() => reload()) }}
                            style={{ padding: '3px 8px', borderRadius: 999, border: '1px solid var(--warning)', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: 10, fontWeight: 700 }}
                          >Valider</button>
                        )}
                        <Badge tone={m.valider ? 'success' : 'warning'}>{m.valider ? 'Validée' : 'Attente'}</Badge>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }} onClick={(ev) => ev.stopPropagation()}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                          {m.information || 'Aucun contenu'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {!m.isRead && (
                            <button
                              onClick={async () => { await messagesApi.marquerLu(m.idMessages); reload() }}
                              style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}
                            >Marquer lu</button>
                          )}
                          {(roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE) && (
                            <button
                              onClick={async () => { if (confirm('Supprimer cette annonce ?')) { await messagesApi.remove(m.idMessages); reload() } }}
                              style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}
                            >Supprimer</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
