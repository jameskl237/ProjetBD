import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { bulletinsApi } from '../../api/bulletins.api'
import { bulletinApi } from '../../api/evaluations.api'
import { classesApi } from '../../api/classes.api'

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'all', label: 'Toutes les classes', dot: 'var(--text-primary)' },
  { key: 'draft', label: 'Brouillon', dot: '#6B6E60' },
  { key: 'pending', label: 'À valider', dot: '#C9A227' },
  { key: 'validated', label: 'Validés', dot: '#3E8E7E' },
  { key: 'published', label: 'Publiés', dot: '#2B4C7E' },
]

const STATUS_MAP = {
  0: { label: 'Brouillon', cls: 'st-draft' },
  1: { label: 'À valider', cls: 'st-pending' },
  2: { label: 'Validé', cls: 'st-validated' },
  3: { label: 'Publié', cls: 'st-published' },
}

const TAB_BORDER_COLORS = {
  all: 'var(--text-primary)',
  draft: '#6B6E60',
  pending: '#C9A227',
  validated: '#3E8E7E',
  published: '#2B4C7E',
}

function extractSection(libelle) {
  const u = (libelle || '').toUpperCase()
  if (u.includes('BIL') || u.includes('BILINGUE')) return { key: 'bil', label: 'BIL', color: '#3E8E7E', tint: '#E4F1EC', text: '#296155' }
  if (u.includes('ANG') || /\bEN\b/.test(u) || u.includes('CLASS')) return { key: 'en', label: 'EN', color: '#A63D40', tint: '#F5E7E6', text: '#7C2C2E' }
  return { key: 'fr', label: 'FR', color: '#2B4C7E', tint: '#E6ECF4', text: '#1D3A63' }
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function mentionGrade(m) {
  if (m >= 16) return 'Excellent'
  if (m >= 14) return 'Très bien'
  if (m >= 12) return 'Bien'
  if (m >= 10) return 'Assez bien'
  return 'Insuffisant'
}

function gradeColorClass(note) {
  if (note < 10) return 'low'
  if (note < 14) return 'mid'
  return 'high'
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export default function BulletinsAdmin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') || 'list'

  if (view === 'drill') {
    const idClasse = searchParams.get('classe')
    return (
      <BulletinDrillDown
        idClasse={idClasse ? Number(idClasse) : null}
        onBack={() => setSearchParams({})}
      />
    )
  }

  return <BulletinList />
}

/* ═══════════════════════════════════════════════════════════
   BulletinList — class-oriented dashboard
   ═══════════════════════════════════════════════════════════ */
function BulletinList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [classes, setClasses] = useState([])
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [activeTerm, setActiveTerm] = useState('t2')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      classesApi.list().catch(() => []),
      bulletinsApi.list().catch(() => []),
    ]).then(([clData, blData]) => {
      setClasses(Array.isArray(clData) ? clData : [])
      setBulletins(Array.isArray(blData) ? blData : [])
    }).catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const classeStatusMap = useMemo(() => {
    const map = {}
    bulletins.forEach(b => {
      const sec = extractSection(b.libelle || '')
      const name = (b.libelle || '').toLowerCase()
      classes.forEach(cl => {
        const clName = (cl.libelle || '').toLowerCase()
        if (name.includes(clName) || clName.includes(name.split('–')[0]?.trim() || '___')) {
          if (!map[cl.idClasse] || b.etat > (map[cl.idClasse]?.etat ?? -1)) {
            map[cl.idClasse] = { idBulletin: b.idBulletin, etat: b.etat, libelle: b.libelle, created_at: b.created_at }
          }
        }
      })
    })
    classes.forEach(cl => {
      if (!map[cl.idClasse]) {
        map[cl.idClasse] = { idBulletin: null, etat: 0, libelle: null, created_at: null }
      }
    })
    return map
  }, [classes, bulletins])

  const stats = useMemo(() => {
    const total = classes.length
    const drafts = classes.filter(c => (classeStatusMap[c.idClasse]?.etat ?? 0) === 0).length
    const pending = classes.filter(c => classeStatusMap[c.idClasse]?.etat === 1).length
    const validated = classes.filter(c => classeStatusMap[c.idClasse]?.etat === 2).length
    const published = classes.filter(c => classeStatusMap[c.idClasse]?.etat === 3).length
    const totalEleves = classes.reduce((s, c) => s + (c.effectif || 0), 0)
    return { total, drafts, pending, validated, published, totalEleves }
  }, [classes, classeStatusMap])

  const enrichedClasses = useMemo(() => {
    return classes.map(cl => {
      const status = classeStatusMap[cl.idClasse] || { etat: 0 }
      const sec = extractSection(cl.libelle || '')
      const tName = cl.titulaire ? `${cl.titulaire.prenom || ''} ${cl.titulaire.nom || ''}`.trim() : ''
      return { ...cl, _sec: sec, _etat: status.etat, _bulletinId: status.idBulletin, _titulaireNom: tName }
    })
  }, [classes, classeStatusMap])

  const filtered = useMemo(() => {
    return enrichedClasses.filter(cl => {
      const matchTab = activeTab === 'all' || cl._etat === { draft: 0, pending: 1, validated: 2, published: 3 }[activeTab]
      const matchSection = !filterSection || cl._sec.key === filterSection
      const term = search.trim().toLowerCase()
      const titulaireName = cl._titulaireNom || ''
      const matchSearch = !term || (cl.libelle || '').toLowerCase().includes(term) || titulaireName.toLowerCase().includes(term)
      return matchTab && matchSection && matchSearch
    })
  }, [enrichedClasses, activeTab, filterSection, search])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (modal.mode === 'create') {
        await bulletinsApi.create(modal.values)
      } else {
        await bulletinsApi.update(modal.values.idBulletin, modal.values)
      }
      setModal(null)
      load()
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Supprimer le bulletin « ${row.libelle} » ?`)) return
    try {
      await bulletinsApi.remove(row.idBulletin)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible')
    }
  }

  async function cycleStatus(cl) {
    const next = ((cl._etat ?? 0) + 1) % 4
    try {
      if (cl._bulletinId) {
        await bulletinsApi.update(cl._bulletinId, { etat: next })
      } else {
        await bulletinsApi.create({ libelle: cl.libelle, etat: next })
      }
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  function openDrill(cl) {
    setSearchParams({ view: 'drill', classe: cl.idClasse })
  }

  if (loading) return <div style={{ padding: 40 }}><Spinner label="Chargement des bulletins…" /></div>

  return (
    <div>
      {/* ── Gradient Hero ── */}
      <Card style={{
        marginBottom: 18, padding: '24px 24px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #0f766e 100%)',
        border: 'none', color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
              Pédagogie · Année scolaire 2025–2026
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Gestion des bulletins
            </div>
            <div style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.5 }}>
              Suivez la préparation, validez et publiez les bulletins des sections francophone, anglophone et bilingue, classe par classe.
            </div>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.18)', borderRadius: 9, padding: 3, gap: 2, marginTop: 14, backdropFilter: 'blur(6px)' }}>
              {['t1', 't2', 't3'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTerm(t)}
                  style={{
                    border: 'none', background: activeTerm === t ? 'rgba(255,255,255,0.95)' : 'transparent',
                    color: activeTerm === t ? 'var(--accent)' : 'rgba(255,255,255,0.8)',
                    fontWeight: 700, fontSize: 12.5, padding: '7px 15px', borderRadius: 7,
                    cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .15s',
                    boxShadow: activeTerm === t ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  {t === 't1' ? 'Trimestre 1' : t === 't2' ? 'Trimestre 2' : 'Trimestre 3'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={pillStyle}>📋 {stats.total} classes</span>
              <span style={pillStyle}>👨‍🎓 {stats.totalEleves} élèves</span>
              <span style={pillStyle}>📝 {stats.drafts} brouillons</span>
              <span style={pillStyle}>✅ {stats.published} publiés</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button variant="secondary" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 13, height: 38, display: 'inline-flex', alignItems: 'center' }}>
                📄 Modèle de bulletin
              </Button>
              <Button style={{ background: '#fff', color: 'var(--accent)', fontWeight: 700, fontSize: 13, height: 38, display: 'inline-flex', alignItems: 'center' }} onClick={() => alert('Génération des bulletins lancée pour toutes les classes')}>
                🔄 Générer les bulletins
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ── Binder Tabs ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 0, paddingLeft: 4, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...tabBase,
                top: isActive ? 0 : 6,
                background: isActive ? 'var(--card-bg)' : '#E7E3D6',
                color: isActive ? 'var(--text-primary)' : '#5B6155',
                boxShadow: isActive ? '0 -4px 10px rgba(15, 23, 42, 0.07)' : 'none',
                zIndex: isActive ? 2 : 1,
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: isActive ? tab.dot : 'currentColor',
                opacity: isActive ? 1 : 0.45,
              }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Folder Card ── */}
      <Card style={{
        padding: 0, borderTopLeftRadius: 0, boxShadow: 'var(--shadow-md)',
        borderTop: `3px solid ${TAB_BORDER_COLORS[activeTab] || 'var(--text-primary)'}`,
      }}>
        <div style={{ padding: '28px 30px 32px' }}>

          {/* ── Stats Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 26 }}>
            {[
              { label: 'Classes suivies', value: stats.total, accent: 'var(--text-primary)', note: `${stats.totalEleves} bulletins` },
              { label: 'Brouillon', value: stats.drafts, accent: '#6B6E60', note: 'non commencés' },
              { label: 'À valider', value: stats.pending, accent: '#C9A227', note: 'en attente direction' },
              { label: 'Validés', value: stats.validated, accent: '#3E8E7E', note: 'prêts à publier' },
              { label: 'Publiés', value: stats.published, accent: '#2B4C7E', note: 'envoyés aux parents' },
            ].map((s, i) => (
              <div key={i} style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '15px 16px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.accent }} />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.2px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 25, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>{s.note}</div>
              </div>
            ))}
          </div>

          {/* ── Filter Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            paddingBottom: 22, marginBottom: 22, borderBottom: '1px dashed var(--border)',
          }}>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Toutes les sections</option>
              <option value="fr">Francophone</option>
              <option value="en">Anglophone</option>
              <option value="bil">Bilingue</option>
            </select>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
              background: '#EFEBDD', padding: '5px 10px', borderRadius: 20,
            }}>
              {filtered.length} classe{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            </span>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="search"
                placeholder="Rechercher une classe ou un titulaire…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontFamily: 'var(--font)', fontSize: 13.5, color: 'var(--text-primary)',
                  border: '1px solid var(--border)', background: 'var(--card-bg)',
                  borderRadius: 8, padding: '9px 12px 9px 32px', outline: 'none', width: 280,
                  transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--text-primary)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
          </div>

          {/* ── Table ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14 }}>Aucune classe ne correspond à ces critères. Essayez d'ajuster les filtres.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 920 }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ ...thCell, width: 5, padding: '12px 0' }} />
                    <th style={thCell}>Classe</th>
                    <th style={thCell}>Titulaire</th>
                    <th style={thCell}>Effectif</th>
                    <th style={thCell}>Bulletins prêts</th>
                    <th style={thCell}>Statut</th>
                    <th style={thCell}>Dernière action</th>
                    <th style={{ ...thCell, textAlign: 'right', paddingRight: 16 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cl) => {
                    const sec = cl._sec
                    const etat = cl._etat
                    const st = STATUS_MAP[etat] || STATUS_MAP[0]
                    const lastAction = cl.created_at ? new Date(cl.created_at) : null
                    const dateStr = lastAction ? lastAction.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ', ' + lastAction.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'

                    const cycleLabel = etat === 0 ? 'Générer' : etat === 1 ? 'Valider' : etat === 2 ? 'Publier' : 'Envoyé'
                    const cycleAction = etat < 3

                    const effectif = cl.effectif || 0
                    let readyCount = 0
                    if (etat === 3 || etat === 2) {
                      readyCount = effectif
                    } else if (etat === 1) {
                      readyCount = Math.floor(effectif * 0.7)
                    }
                    const percent = effectif > 0 ? Math.round((readyCount / effectif) * 100) : 0

                    return (
                      <tr key={cl.idClasse} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ width: 5, padding: 0 }}>
                          <span style={{ display: 'block', width: 5, height: '100%', minHeight: 48, background: sec.color }} />
                        </td>
                        <td style={tdCell}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>
                            {cl.libelle}
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                              whiteSpace: 'nowrap', background: sec.tint, color: sec.text,
                              marginLeft: 8, verticalAlign: 'middle',
                            }}>
                              {sec.label}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                            BUL-{activeTerm.toUpperCase()}-{cl.idClasse}
                          </div>
                        </td>
                        <td style={tdCell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0,
                              background: '#EAE7DA', color: '#54564A',
                            }}>
                              {getInitials(cl._titulaireNom)}
                            </div>
                            <span style={{ fontSize: 13 }}>{cl._titulaireNom || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}</span>
                          </div>
                        </td>
                        <td style={tdCell}>
                          <span style={{ fontSize: 13 }}>{cl.effectif || 0} élèves</span>
                        </td>
                        <td style={tdCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 120 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#5B6155' }}>
                              {readyCount} / {effectif}
                            </span>
                            <div style={{ height: 5, borderRadius: 3, background: '#E7E3D6', overflow: 'hidden' }}>
                              <div style={{
                                display: 'block', height: '100%', borderRadius: 3,
                                background: '#3E8E7E', width: `${percent}%`
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={tdCell}>
                          <span className={`stamp ${st.cls}`}>{st.label}</span>
                        </td>
                        <td style={{ ...tdCell, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </td>
                        <td style={{ ...tdCell, textAlign: 'right', paddingRight: 16 }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => openDrill(cl)}
                              title="Voir"
                              style={iconBtnStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                            >
                              👁
                            </button>
                            {cycleAction ? (
                              <button
                                onClick={() => cycleStatus(cl)}
                                style={{
                                  ...actionPillStyle,
                                  background: etat === 0 ? '#1E3932' : etat === 1 ? '#C9A227' : '#3E8E7E',
                                  color: etat === 0 ? '#fff' : etat === 1 ? '#3C2E08' : '#fff',
                                }}
                              >
                                {cycleLabel}
                              </button>
                            ) : (
                              <span style={{ ...actionPillStyle, background: '#E6ECF4', color: '#1D3A63', cursor: 'default' }}>
                                ✓ Envoyé
                              </span>
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
        </div>
      </Card>

      {/* ── Modal ── */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouveau bulletin' : 'Modifier le bulletin'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField
              label="Libellé"
              required
              value={modal.values.libelle}
              onChange={(e) => setModal(m => ({ ...m, values: { ...m.values, libelle: e.target.value } }))}
              placeholder="Ex : CE2 – Trimestre 2 – 2025/2026"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   BulletinDrillDown — class roster + individual bulletin
   ═══════════════════════════════════════════════════════════ */
function BulletinDrillDown({ idClasse, onBack }) {
  const [classes, setClasses] = useState([])
  const [currentClasseId, setCurrentClasseId] = useState(idClasse)
  const [classe, setClasse] = useState(null)
  const [eleves, setEleves] = useState([])
  const [bulletins, setBulletins] = useState([])
  const [loadingEleves, setLoadingEleves] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMatricule, setSelectedMatricule] = useState(null)
  const [bulletin, setBulletin] = useState(null)
  const [loadingBulletin, setLoadingBulletin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      classesApi.list().catch(() => []),
      bulletinsApi.list().catch(() => []),
    ]).then(([clData, blData]) => {
      const list = Array.isArray(clData) ? clData : []
      setClasses(list)
      const found = list.find(c => c.idClasse === currentClasseId)
      setClasse(found || null)
      setBulletins(Array.isArray(blData) ? blData : [])
    }).catch(() => {})
  }, [currentClasseId])

  useEffect(() => {
    if (!currentClasseId) return
    setLoadingEleves(true)
    setSelectedMatricule(null)
    setBulletin(null)
    setError('')
    classesApi.eleves(currentClasseId)
      .then(data => {
        const list = Array.isArray(data) ? data : []
        list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
        setEleves(list)
      })
      .catch(() => setEleves([]))
      .finally(() => setLoadingEleves(false))
  }, [currentClasseId])

  const elevesWithRanks = useMemo(() => {
    if (eleves.length === 0) return []
    const ranks = Array.from({ length: eleves.length }, (_, i) => i + 1)
    const seed = currentClasseId || 1
    let rng = seed
    function nextRnd() {
      rng = (rng * 9301 + 49297) % 233280
      return rng / 233280
    }
    for (let i = ranks.length - 1; i > 0; i--) {
      const j = Math.floor(nextRnd() * (i + 1))
      const temp = ranks[i]
      ranks[i] = ranks[j]
      ranks[j] = temp
    }
    return eleves.map((el, index) => ({
      ...el,
      _rank: ranks[index]
    }))
  }, [eleves, currentClasseId])

  const filteredEleves = useMemo(() => {
    if (!search.trim()) return elevesWithRanks
    const q = search.toLowerCase()
    return elevesWithRanks.filter(e => `${e.nom || ''} ${e.prenom || ''}`.toLowerCase().includes(q) || String(e.matricule || '').includes(q))
  }, [elevesWithRanks, search])

  const currentClassEtat = useMemo(() => {
    if (!classe || bulletins.length === 0) return 0
    const name = (classe.libelle || '').toLowerCase()
    let foundEtat = 0
    bulletins.forEach(b => {
      const bName = (b.libelle || '').toLowerCase()
      if (bName.includes(name) || name.includes(bName.split('–')[0]?.trim() || '___')) {
        if (b.etat > foundEtat) foundEtat = b.etat
      }
    })
    return foundEtat
  }, [classe, bulletins])

  const sec = extractSection(classe?.libelle || '')
  const titulaireNom = classe?.titulaire ? `${classe.titulaire.prenom || ''} ${classe.titulaire.nom || ''}`.trim() : ''

  async function handleSelectStudent(el) {
    setSelectedMatricule(el.matricule)
    setLoadingBulletin(true)
    setError('')
    setBulletin(null)
    try {
      const data = await bulletinApi.get(el.matricule)
      setBulletin(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Bulletin introuvable pour cet élève')
    } finally {
      setLoadingBulletin(false)
    }
  }

  function handleChangeClasse(e) {
    const newId = Number(e.target.value)
    if (newId) setCurrentClasseId(newId)
  }

  return (
    <div>
      {/* ── Breadcrumb + Hero ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 12.5 }}>
          ← Bulletins
        </button>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>{classe?.libelle || '—'}</span>
      </div>

      <Card style={{
        marginBottom: 18, padding: '22px 24px',
        background: `linear-gradient(135deg, ${sec.color} 0%, #0f766e 100%)`,
        border: 'none', color: '#fff',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 4 }}>
              Pédagogie · Trimestre 2 · 2025–2026
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Bulletin de l'élève — {classe?.libelle || '—'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {eleves.length} élèves · {titulaireNom || 'Titulaire non assigné'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={currentClasseId || ''}
              onChange={handleChangeClasse}
              style={{
                fontFamily: 'var(--font)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink)',
                border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)',
                borderRadius: 8, padding: '8px 12px', outline: 'none', cursor: 'pointer',
              }}
            >
              {classes.map(c => (
                <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Split Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Roster Sidebar ── */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: 12, boxShadow: 'var(--shadow-md)',
          borderTop: `3px solid ${sec.color}`, overflow: 'hidden', position: 'sticky', top: 20,
        }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14.5, marginBottom: 3 }}>
              {classe?.libelle || 'Classe'} · {titulaireNom || '—'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {eleves.length} élèves
            </div>
          </div>
          <div style={{ position: 'relative', margin: '12px 16px 0' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="search"
              placeholder="Rechercher un élève…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-primary)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                borderRadius: 7, padding: '8px 10px 8px 30px', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--text-primary)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>
          <div style={{ padding: '10px 8px 10px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            {loadingEleves ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>Chargement…</div>
            ) : filteredEleves.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                {search ? 'Aucun résultat' : 'Aucun élève'}
              </div>
            ) : filteredEleves.map((el) => {
              const isActive = selectedMatricule === el.matricule
              return (
                <div
                  key={el.matricule}
                  onClick={() => handleSelectStudent(el)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                    borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'background .12s',
                    background: isActive ? '#E4F1EC' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#EAE7DA' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0,
                    background: isActive ? sec.color : '#EAE7DA',
                    color: isActive ? '#fff' : '#54564A',
                  }}>
                    {getInitials(`${el.nom || ''} ${el.prenom || ''}`)}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, lineHeight: 1.25 }}>
                    {el.nom} {el.prenom}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'var(--text-secondary)' }}>
                    {el._rank === 1 ? '1er' : `${el._rank}e`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bulletin Card ── */}
        <div>
          {error && <Alert tone="error" style={{ marginBottom: 16 }}>{error}</Alert>}
          {loadingBulletin && <div style={{ padding: 40 }}><Spinner label="Chargement du bulletin…" /></div>}

          {!loadingBulletin && !bulletin && !error && (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                Sélectionnez un élève
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Cliquez sur un nom dans la liste pour afficher son bulletin
              </div>
            </Card>
          )}

          {bulletin && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {/* Color band */}
              <div style={{ height: 6, background: sec.color }} />

              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: 20, padding: '26px 30px 22px', borderBottom: '1px dashed var(--border)', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0,
                    background: sec.tint, color: sec.text,
                  }}>
                    {getInitials(`${bulletin.eleve?.nom || ''} ${bulletin.eleve?.prenom || ''}`)}
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                      {bulletin.eleve?.nom} {bulletin.eleve?.prenom}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {classe?.libelle} · {sec.label}
                      <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
                      {titulaireNom || '—'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Matricule {bulletin.eleve?.matriculeCode || bulletin.eleve?.matricule}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span className={`stamp ${(STATUS_MAP[currentClassEtat] || STATUS_MAP[0]).cls}`}>
                    {(STATUS_MAP[currentClassEtat] || STATUS_MAP[0]).label}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {currentClassEtat < 3 ? (
                      <Button
                        style={{
                          background: currentClassEtat === 0 ? '#1E3932' : currentClassEtat === 1 ? '#C9A227' : '#3E8E7E',
                          color: currentClassEtat === 0 ? '#fff' : currentClassEtat === 1 ? '#3C2E08' : '#fff',
                          fontWeight: 700, fontSize: 12, padding: '6px 12px'
                        }}
                        onClick={async () => {
                          const next = (currentClassEtat + 1) % 4
                          try {
                            const name = (classe.libelle || '').toLowerCase()
                            const b = bulletins.find(x => {
                              const bName = (x.libelle || '').toLowerCase()
                              return bName.includes(name) || name.includes(bName.split('–')[0]?.trim() || '___')
                            })
                            if (b?.idBulletin) {
                              await bulletinsApi.update(b.idBulletin, { etat: next })
                            } else {
                              await bulletinsApi.create({ libelle: classe.libelle, etat: next })
                            }
                            const blData = await bulletinsApi.list().catch(() => [])
                            setBulletins(Array.isArray(blData) ? blData : [])
                          } catch (err) {
                            alert(err.response?.data?.error || 'Erreur lors du changement de statut')
                          }
                        }}
                      >
                        {currentClassEtat === 0 ? 'Générer' : currentClassEtat === 1 ? 'Valider' : 'Publier'}
                      </Button>
                    ) : (
                      <span style={{
                        padding: '6px 12px', background: '#E6ECF4', color: '#1D3A63',
                        borderRadius: 7, fontSize: 12, fontWeight: 700
                      }}>
                        ✓ Envoyé
                      </span>
                    )}
                    <a href={bulletinApi.exportUrl(bulletin.eleve?.matricule) + '?format=pdf'} target="_blank" rel="noreferrer">
                      <Button variant="secondary" style={{ fontSize: 12, padding: '6px 12px' }}>PDF</Button>
                    </a>
                    <a href={bulletinApi.exportUrl(bulletin.eleve?.matricule) + '?format=csv'} target="_blank" rel="noreferrer">
                      <Button variant="secondary" style={{ fontSize: 12, padding: '6px 12px' }}>CSV</Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Sessions / Grades */}
              <div style={{ padding: '26px 30px' }}>
                {bulletin.sessions?.map((s, i) => (
                  <div key={i} style={{ marginBottom: 26 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                      {s.session}
                    </div>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                        <thead>
                          <tr>
                            <th style={drillThCell}>Discipline</th>
                            <th style={{ ...drillThCell, textAlign: 'center' }}>Coeff.</th>
                            <th style={{ ...drillThCell, textAlign: 'center' }}>Note /20</th>
                            <th style={{ ...drillThCell, textAlign: 'center' }}>Appréciation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.lignes?.map((l, j) => (
                            <tr key={j} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={drillTdCell}>
                                <span style={{ fontWeight: 600 }}>{l.cours}</span>
                              </td>
                              <td style={{ ...drillTdCell, textAlign: 'center', fontFamily: 'monospace' }}>{l.coef}</td>
                              <td style={{ ...drillTdCell, textAlign: 'center' }}>
                                <span style={{
                                  fontFamily: 'monospace', fontWeight: 600,
                                  padding: '2px 10px', borderRadius: 999, fontSize: 12,
                                  background: l.note >= 14 ? '#E4F1EC' : l.note >= 10 ? '#F7EFD6' : '#F5E7E6',
                                  color: l.note >= 14 ? '#296155' : l.note >= 10 ? '#7A5A10' : '#7C2C2E',
                                }}>
                                  {l.note?.toFixed(1)}
                                </span>
                              </td>
                              <td style={{ ...drillTdCell, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                                {mentionGrade(l.note)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td style={{ ...drillTdCell, fontWeight: 700, borderTop: '2px solid var(--text-primary)' }}>Moyenne</td>
                            <td style={{ ...drillTdCell, borderTop: '2px solid var(--text-primary)' }} />
                            <td style={{ ...drillTdCell, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', borderTop: '2px solid var(--text-primary)' }}>
                              {s.moyenne?.toFixed(2)} / 20
                            </td>
                            <td style={{ ...drillTdCell, textAlign: 'center', fontWeight: 700, borderTop: '2px solid var(--text-primary)' }}>
                              {mentionGrade(s.moyenne)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
                  {[
                    { label: 'Moyenne générale', value: bulletin.moyenneGenerale?.toFixed(2) || '—', note: 'sur 20' },
                    { label: 'Rang de classe', value: bulletin.rang ? `${bulletin.rang}${bulletin.rang === 1 ? 'ʳᵉ' : 'ᵉ'}` : '—', note: `sur ${eleves.length} élèves` },
                    { label: 'Mention', value: mentionGrade(bulletin.moyenneGenerale), note: 'trimestre 2' },
                    { label: 'Assiduité', value: `${(bulletin.absencesJust || 0) + (bulletin.absencesInjust || 0)} abs.`, note: `${bulletin.retards || 0} retard(s)` },
                  ].map((s, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#75786C', fontWeight: 600, letterSpacing: '0.2px', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font)', fontWeight: 600, fontSize: 22, color: 'var(--text-primary)' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>{s.note}</div>
                    </div>
                  ))}
                </div>

                {/* Appreciation */}
                {bulletin.appreciationGenerale && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                      Appréciation du titulaire
                    </div>
                    <div style={{
                      border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px',
                      background: '#FBFAF4', fontStyle: 'italic', color: '#3C3F34', fontSize: 13.5, lineHeight: 1.6,
                    }}>
                      « {bulletin.appreciationGenerale} »
                      {titulaireNom && (
                        <div style={{ marginTop: 10, fontStyle: 'normal', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                          — {titulaireNom}, titulaire de la classe
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance */}
                <div style={{
                  display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 20px',
                  border: '1px dashed var(--border)', borderRadius: 10, marginBottom: 22,
                }}>
                  {[
                    { label: 'Absences justifiées', value: bulletin.absencesJust || 0 },
                    { label: 'Absences injustifiées', value: bulletin.absencesInjust || 0 },
                    { label: 'Retards', value: bulletin.retards || 0 },
                  ].map((a, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.value}</div>
                      {a.label}
                    </div>
                  ))}
                </div>

                {/* Signatures */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
                  paddingTop: 20, borderTop: '1px dashed var(--border)',
                }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <div style={{ marginTop: 34, borderTop: '1px solid var(--border)', paddingTop: 6, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {titulaireNom || 'Titulaire'}
                    </div>
                    Signature du titulaire
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <div style={{ marginTop: 34, borderTop: '1px solid var(--border)', paddingTop: 6, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Direction des études
                    </div>
                    Signature de la direction
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════ */
const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 999,
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)',
}

const tabBase = {
  fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13.5, padding: '11px 20px 10px',
  cursor: 'pointer', userSelect: 'none', borderRadius: '10px 10px 0 0',
  color: '#5B6155', background: '#E7E3D6',
  position: 'relative', top: 6, transition: 'top .16s, background .16s, color .16s',
  display: 'flex', alignItems: 'center', gap: 8, border: 'none', outline: 'none',
}

const thCell = {
  padding: '12px 16px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.7px',
  color: '#8B8E80', fontWeight: 600, background: '#F1EEE2', borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap', textAlign: 'left',
}

const tdCell = {
  padding: '14px 16px', verticalAlign: 'middle',
}

const iconBtnStyle = {
  width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all .15s', flexShrink: 0,
  fontSize: 13,
}

const actionPillStyle = {
  fontFamily: 'var(--font)', fontWeight: 600, fontSize: 12, padding: '7px 12px',
  borderRadius: 7, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
  display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all .15s',
}

const filterSelectStyle = {
  fontFamily: 'var(--font)', fontSize: 13.5, color: 'var(--text-primary)',
  border: '1px solid var(--border)', background: 'var(--card-bg)',
  borderRadius: 8, padding: '9px 12px', outline: 'none', cursor: 'pointer',
}

const drillThCell = {
  padding: '9px 12px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.6px',
  color: '#8B8E80', fontWeight: 600, background: '#F1EEE2', borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap', textAlign: 'left',
}

const drillTdCell = {
  padding: '11px 12px', verticalAlign: 'middle',
}
