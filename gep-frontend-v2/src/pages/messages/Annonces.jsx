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
import { parentsApi } from '../../api/parents.api'
import { classesApi } from '../../api/classes.api'
import { coursApi } from '../../api/cours.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const searchBox = {
  flex: 1, border: 'none', outline: 'none', fontSize: 14,
  background: 'transparent', color: 'var(--text-primary)',
}

const tabBtn = (active) => ({
  flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
  background: active ? 'var(--accent-light)' : '#fff',
  color: active ? 'var(--accent)' : 'var(--text-secondary)',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
})

const selectStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', fontSize: 14, background: '#fff', color: 'var(--text-primary)',
}

const infoBox = (bg = '#f0faf8', border = '#b2dfdb', color = 'var(--accent)') => ({
  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  background: bg, border: `1px solid ${border}`, fontSize: 13, color, display: 'flex', alignItems: 'center', gap: 8,
})

export default function Annonces() {
  const { data, loading, error, reload } = useResource(messagesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const canCompose = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.ENSEIGNANT

  const [parents, setParents] = useState([])
  const [classes, setClasses] = useState([])
  const [enseignants, setEnseignants] = useState([])
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

  useEffect(() => {
    if (!canCompose) return
    coursApi.enseignants ? coursApi.enseignants.list().then(setEnseignants).catch(() => {}) : fetch('/api/cours/enseignants').then(r => r.json()).then(setEnseignants).catch(() => {})
  }, [canCompose])

  const parentsWithEleve = useMemo(() => parents.filter((p) => p.matricule), [parents])

  const classesSorted = useMemo(() => [...classes].sort((a, b) => (a.libelle || '').localeCompare(b.libelle || '')), [classes])

  const selectedClasseObj = useMemo(() => classes.find((c) => c.idClasse === Number(selectedClasse)), [classes, selectedClasse])

  const filteredParents = useMemo(() => {
    let list = parentsWithEleve
    if (selectedClasse) {
      const matriculesInClass = new Set()
      list.forEach((p) => { if (p.eleve) matriculesInClass.add(p.matricule) })
    }
    if (!ddSearch.trim()) return list
    const q = ddSearch.toLowerCase()
    return list.filter((p) => {
      const nom = (p.personne?.nom || '').toLowerCase()
      const prenom = (p.personne?.prenom || '').toLowerCase()
      const elNom = (p.eleve?.nom || '').toLowerCase()
      const elPrenom = (p.eleve?.prenom || '').toLowerCase()
      return nom.includes(q) || prenom.includes(q) || elNom.includes(q) || elPrenom.includes(q)
    })
  }, [parentsWithEleve, ddSearch, selectedClasse])

  const filteredEnseignants = useMemo(() => {
    let list = enseignants
    if (selectedClasse) {
      list = list.filter((e) => e.cours?.classe?.idClasse === Number(selectedClasse))
    }
    if (!ddSearch.trim()) return list
    const q = ddSearch.toLowerCase()
    return list.filter((e) => {
      const nom = (e.personne?.nom || '').toLowerCase()
      const prenom = (e.personne?.prenom || '').toLowerCase()
      const matiere = (e.cours?.matiere || '').toLowerCase()
      return nom.includes(q) || prenom.includes(q) || matiere.includes(q)
    })
  }, [enseignants, ddSearch, selectedClasse])

  const currentList = destTab === 'parents' ? filteredParents : filteredEnseignants
  const currentLabel = destTab === 'parents' ? 'parent' : 'enseignant'

  const selectedObj = useMemo(() => {
    if (!selectedId || destTab === 'tout') return null
    if (destTab === 'parents') return parents.find((p) => p.idParent === Number(selectedId))
    return enseignants.find((e) => e.idPers === Number(selectedId))
  }, [selectedId, destTab, parents, enseignants])

  function resetForm() {
    setObjet('')
    setInformation('')
    setSelectedId('')
    setSelectedClasse('')
    setDdSearch('')
  }

  function getRecipientSummary() {
    if (destTab === 'tout') return { label: 'Tout le monde', sub: 'Personnel, parents, enseignants' }
    if (destMode === 'all') {
      const count = destTab === 'parents' ? parentsWithEleve.length : enseignants.length
      return { label: `Tous les ${currentLabel}s`, sub: `${count} destinataire(s)` }
    }
    if (destMode === 'classe' && selectedClasseObj) {
      return { label: selectedClasseObj.libelle, sub: `${currentLabel}s de cette classe` }
    }
    if (destMode === 'single' && selectedObj) {
      const name = selectedObj.personne ? `${selectedObj.personne.nom} ${selectedObj.personne.prenom}` : `#${selectedObj.id}`
      const sub = destTab === 'parents' && selectedObj.eleve ? `Parent de ${selectedObj.eleve.nom} ${selectedObj.eleve.prenom}` : selectedObj.cours?.matiere || null
      return { label: name, sub }
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    if (!objet.trim() || !information.trim()) { setFormError('Remplissez tous les champs'); return }

    try {
      if (destTab === 'tout') {
        const res = await messagesApi.broadcast({ target: 'all', objet: objet.trim(), information: information.trim() })
        setFormSuccess(res.message || 'Annonce(s) envoyée(s)')
      } else if (destMode === 'single' && selectedId) {
        if (destTab === 'parents') {
          await messagesApi.create({ idParent: Number(selectedId), objet: objet.trim(), information: information.trim() })
        } else {
          await messagesApi.broadcast({ target: 'enseignants', ids: [Number(selectedId)], objet: objet.trim(), information: information.trim() })
        }
        setFormSuccess('Annonce envoyée')
      } else {
        const target = destTab === 'parents' ? 'parents' : 'enseignants'
        const payload = { target, objet: objet.trim(), information: information.trim() }
        if (destMode === 'classe' && selectedClasse) payload.idClasse = Number(selectedClasse)
        const res = await messagesApi.broadcast(payload)
        setFormSuccess(res.message || 'Annonce(s) envoyée(s)')
      }
      resetForm()
      reload()
      setTimeout(() => setFormSuccess(''), 4000)
    } catch (err) { setFormError(err.response?.data?.error || "Erreur lors de l'envoi") }
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
      <PageHeader title="Annonces" subtitle="Communications entre l'établissement et les familles" />

      <div style={{ display: 'grid', gridTemplateColumns: canCompose ? 'minmax(300px, 1fr) minmax(400px, 2.5fr)' : '1fr', gap: 20, alignItems: 'start' }}>
        {canCompose && (
          <Card style={{ padding: '22px 20px', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #0f766e)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>+</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Nouvelle annonce</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Envoyer un message</div>
              </div>
            </div>

            <Alert tone="error">{formError}</Alert>
            {formSuccess && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#2ecc7122', color: '#27ae60', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{formSuccess}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Destinataires <span style={{ color: 'var(--danger)' }}>*</span>
                </label>

                {/* --- 3 tabs --- */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <button type="button" onClick={() => { setDestTab('parents'); setDestMode('all'); setSelectedId(''); setDdSearch('') }} style={tabBtn(destTab === 'parents')}>
                    👨‍👩‍👧 Parents
                  </button>
                  <button type="button" onClick={() => { setDestTab('enseignants'); setDestMode('all'); setSelectedId(''); setDdSearch('') }} style={tabBtn(destTab === 'enseignants')}>
                    👨‍🏫 Enseignants
                  </button>
                  <button type="button" onClick={() => { setDestTab('tout'); setSelectedId(''); setDdSearch('') }} style={tabBtn(destTab === 'tout')}>
                    🌍 Tout
                  </button>
                </div>

                {/* --- Sub-modes (pas pour "tout") --- */}
                {destTab !== 'tout' && (
                  <>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <button type="button" onClick={() => { setDestMode('all'); setSelectedId(''); setDdSearch('') }} style={{ ...tabBtn(destMode === 'all'), fontSize: 12, padding: '7px 10px' }}>
                        Tous
                      </button>
                      <button type="button" onClick={() => { setDestMode('classe'); setSelectedId(''); setDdSearch('') }} style={{ ...tabBtn(destMode === 'classe'), fontSize: 12, padding: '7px 10px' }}>
                        Par classe
                      </button>
                      <button type="button" onClick={() => { setDestMode('single'); setDdSearch('') }} style={{ ...tabBtn(destMode === 'single'), fontSize: 12, padding: '7px 10px' }}>
                        Individuel
                      </button>
                    </div>

                    {/* --- Classe selector (modes all et classe) --- */}
                    {destMode !== 'single' && (
                      <div style={{ marginBottom: 10 }}>
                        <select value={selectedClasse} onChange={(e) => setSelectedClasse(e.target.value)} style={selectStyle}>
                          <option value="">Toutes les classes</option>
                          {classesSorted.map((c) => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
                        </select>
                      </div>
                    )}

                    {/* --- Individuel dropdown --- */}
                    {destMode === 'single' && (
                      <div ref={ddRef} style={{ position: 'relative' }}>
                        {selectedObj ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
                            background: 'var(--accent-light)', cursor: 'pointer',
                          }} onClick={() => { setSelectedId(''); setDdSearch(''); setDdOpen(true) }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                              {selectedObj.personne?.nom?.[0]}{selectedObj.personne?.prenom?.[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedObj.personne?.nom} {selectedObj.personne?.prenom}</div>
                              {destTab === 'parents' && selectedObj.eleve && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>Parent de {selectedObj.eleve.nom} {selectedObj.eleve.prenom}</div>}
                              {destTab === 'enseignants' && selectedObj.cours && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 1 }}>{selectedObj.cours.matiere} — {selectedObj.cours.classe?.libelle}</div>}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>✕</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', cursor: 'text' }} onClick={() => setDdOpen(true)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                              <input
                                type="text"
                                placeholder={`Rechercher un ${currentLabel}…`}
                                value={ddSearch}
                                onChange={(e) => { setDdSearch(e.target.value); setDdOpen(true) }}
                                onFocus={() => setDdOpen(true)}
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--text-primary)' }}
                              />
                              {!ddSearch && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentList.length}</span>}
                            </div>
                            {ddOpen && (
                              <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                marginTop: 4, maxHeight: 220, overflowY: 'auto',
                                background: 'var(--bg-primary, #fff)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              }}>
                                {currentList.length === 0 ? (
                                  <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Aucun résultat</div>
                                ) : (
                                  currentList.map((item) => {
                                    const id = destTab === 'parents' ? item.idParent : item.idPers
                                    return (
                                      <div
                                        key={id}
                                        onClick={() => { setSelectedId(String(id)); setDdOpen(false); setDdSearch('') }}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 10,
                                          padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light, var(--border))',
                                          transition: 'background 0.12s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                                          {item.personne?.nom?.[0]}{item.personne?.prenom?.[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.personne?.nom} {item.personne?.prenom}</div>
                                          {destTab === 'parents' && item.eleve && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Parent de {item.eleve.nom} {item.eleve.prenom}</div>}
                                          {destTab === 'enseignants' && item.cours && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.cours.matiere} — {item.cours.classe?.libelle}</div>}
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* --- Résumé destinataire --- */}
                {summary && (
                  <div style={{ marginTop: 10, ...infoBox() }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    <span><strong>{summary.label}</strong>{summary.sub && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>— {summary.sub}</span>}</span>
                  </div>
                )}
              </div>

              <InputField label="Objet" required value={objet} onChange={(e) => setObjet(e.target.value)} />

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Message</label>
                <textarea
                  required rows={5} value={information} onChange={(e) => setInformation(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                    outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <Button type="submit" style={{ width: '100%' }}>
                {destTab === 'tout' || destMode === 'all' || destMode === 'classe' ? 'Envoyer à tous' : 'Envoyer l\'annonce'}
              </Button>
            </form>
          </Card>
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
