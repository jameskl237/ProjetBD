import { useEffect, useState, useMemo } from 'react'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'

const SECTION_TONES = {
  Anglophone: 'danger',
  Francophone: 'info',
  Bilingue: 'success',
  Bilingual: 'success',
}

const SECTION_COLORS = {
  Anglophone: { bg: 'rgba(225,29,72,0.08)', accent: 'var(--danger)', text: 'var(--danger)' },
  Francophone: { bg: 'rgba(6,182,212,0.08)', accent: 'var(--info)', text: 'var(--info)' },
  Bilingue: { bg: 'rgba(5,150,105,0.08)', accent: 'var(--success)', text: 'var(--success)' },
  Bilingual: { bg: 'rgba(5,150,105,0.08)', accent: 'var(--success)', text: 'var(--success)' },
}

const SECTION_KEY = {
  Anglophone: 'anglo',
  Francophone: 'franco',
  Bilingue: 'bilingue',
  Bilingual: 'bilingue',
}

const TAB_ACCENT = {
  all: 'var(--accent)',
  anglo: 'var(--danger)',
  franco: 'var(--info)',
  bilingue: 'var(--success)',
}

export default function Cours() {
  const [cours, setCours] = useState(null)
  const [enseignants, setEnseignants] = useState(null)
  const [classes, setClasses] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      coursApi.list(),
      enseignantsApi.list(),
      classesApi.list(),
    ])
      .then(([c, e, cl]) => { setCours(c); setEnseignants(e); setClasses(cl) })
      .catch((e) => setError(e.response?.data?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const coursEnseignants = useMemo(() => {
    if (!enseignants) return {}
    const map = {}
    enseignants.forEach((e) => {
      const id = e.cours?.idCours
      if (!id || !e.personne) return
      if (!map[id]) map[id] = []
      if (!map[id].some((p) => p.idPers === e.personne.idPers)) {
        map[id].push(e.personne)
      }
    })
    return map
  }, [enseignants])

  const filtered = useMemo(() => {
    if (!cours) return []
    let list = cours
    if (activeTab !== 'all') {
      list = list.filter((c) => {
        const key = SECTION_KEY[c.section]
        return key === activeTab
      })
    }
    if (filterClasse) list = list.filter((c) => c.classe?.idClasse === Number(filterClasse))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        c.libelle?.toLowerCase().includes(q) ||
        c.classe?.libelle?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        coursEnseignants[c.idCours]?.some((p) => `${p.nom} ${p.prenom}`.toLowerCase().includes(q))
      )
    }
    return list
  }, [cours, activeTab, filterClasse, search, coursEnseignants])

  const sections = useMemo(() => {
    if (!cours) return []
    return [...new Set(cours.map((c) => c.section).filter(Boolean))]
  }, [cours])

  const stats = useMemo(() => {
    if (!cours) return { total: 0, bySection: {} }
    const bySection = {}
    cours.forEach((c) => {
      const s = c.section || 'Non défini'
      bySection[s] = (bySection[s] || 0) + 1
    })
    return { total: cours.length, bySection }
  }, [cours])

  function openCreate() {
    setModal({
      mode: 'create',
      values: { libelle: '', idClasse: '', coefficient: 1, heures: '', description: '' },
    })
    setFormError('')
  }

  function openEdit(row) {
    setModal({ mode: 'edit', values: { ...row, idClasse: row.classe?.idClasse || row.idClasse || '' } })
    setFormError('')
  }

  async function handleDelete(row) {
    if (!confirm(`Supprimer le cours « ${row.libelle} » ?`)) return
    try {
      await coursApi.remove(row.idCours)
      setCours((prev) => prev.filter((c) => c.idCours !== row.idCours))
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (modal.mode === 'create') {
        const created = await coursApi.create(modal.values)
        setCours((prev) => [...prev, { ...modal.values, idCours: created.idCours, classe: classes?.find((c) => c.idClasse === Number(modal.values.idClasse)) || null, section: null, enseignants: [] }])
      } else {
        await coursApi.update(modal.values.idCours, modal.values)
        setCours((prev) => prev.map((c) => c.idCours === modal.values.idCours ? { ...c, ...modal.values, classe: classes?.find((cl) => cl.idClasse === Number(modal.values.idClasse)) || c.classe } : c))
      }
      setModal(null)
    } catch (err) {
      setFormError(err.response?.data?.error || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Chargement des cours…" />

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--success)', marginBottom: 6 }}>
            Pédagogie
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Gestion des cours
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 520 }}>
            Consultez, filtrez et organisez les cours des sections francophone, anglophone et bilingue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" onClick={() => window.location.href = '/cours/emploi-du-temps'}>
            <span style={{ marginRight: 6 }}>📅</span> Emploi du temps
          </Button>
          <Button onClick={openCreate}>
            <span style={{ marginRight: 6 }}>＋</span> Ajouter un cours
          </Button>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      {/* ── Binder Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginTop: 22, paddingLeft: 4, alignItems: 'flex-end' }}>
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} accent={TAB_ACCENT.all}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: TAB_ACCENT.all, opacity: 0.6, display: 'inline-block' }} />
          Toutes les sections
        </TabButton>
        {sections.map((s) => {
          const key = SECTION_KEY[s] || s.toLowerCase()
          const accent = TAB_ACCENT[key] || 'var(--accent)'
          return (
            <TabButton key={s} active={activeTab === key} onClick={() => setActiveTab(key)} accent={accent}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, opacity: 0.6, display: 'inline-block' }} />
              {s}
            </TabButton>
          )
        })}
      </div>

      {/* ── Folder panel ── */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '0 var(--radius) var(--radius) var(--radius)',
        boxShadow: 'var(--shadow-md)',
        padding: '26px 28px 30px',
        borderTop: `3px solid ${TAB_ACCENT[activeTab] || 'var(--text-primary)'}`,
        minHeight: 300,
      }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sections.length + 1, 4)}, 1fr)`, gap: 14, marginBottom: 22 }}>
          <StatBlock accent="var(--text-primary)" label="Total des cours" value={stats.total} note={`${sections.length} section${sections.length > 1 ? 's' : ''}`} />
          {sections.map((s) => {
            const c = SECTION_COLORS[s] || { bg: 'var(--border-light)', accent: 'var(--text-secondary)', text: 'var(--text-secondary)' }
            const classeRange = cours
              ?.filter((x) => x.section === s && x.classe?.libelle)
              .map((x) => x.classe.libelle)
            const note = classeRange && classeRange.length > 0
              ? [...new Set(classeRange)].slice(0, 2).join(', ') + (classeRange.length > 2 ? '…' : '')
              : '—'
            return <StatBlock key={s} accent={c.accent} label={`Section ${s}`} value={stats.bySection[s] || 0} note={note} />
          })}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingBottom: 20, marginBottom: 22, borderBottom: '2px dashed var(--border)' }}>
          <SelectField
            placeholder="Toutes les classes"
            options={(classes || []).map((c) => ({ value: c.idClasse, label: c.libelle }))}
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            style={{ width: 200, marginBottom: 0 }}
          />
          <span style={{
            fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)',
            background: 'var(--border-light)', padding: '5px 12px', borderRadius: 20,
          }}>
            {filtered.length} cours affiché{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="search"
              placeholder="Rechercher un cours ou un enseignant…"
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
                  { label: 'Cours', width: '22%' },
                  { label: 'Classe', width: '14%' },
                  { label: 'Section', width: '14%' },
                  { label: 'Enseignant(s)', width: '20%' },
                  { label: 'Coeff.', width: '8%' },
                  { label: 'Heures', width: '8%' },
                  { label: '', width: '14%' },
                ].map((col, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid var(--border)',
                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: 0.5, width: col.width, whiteSpace: 'nowrap',
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      {search || filterClasse || activeTab !== 'all' ? 'Aucun cours ne correspond à ces critères.' : 'Aucun cours enregistré.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((c) => {
                const ens = coursEnseignants[c.idCours] || []
                return (
                  <tr
                    key={c.idCours}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .12s' }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>{c.libelle}</span>
                        {c.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                            {c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.classe?.libelle ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                          {c.classe.libelle}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.section ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                          background: SECTION_COLORS[c.section]?.bg || 'var(--border-light)',
                          color: SECTION_COLORS[c.section]?.text || 'var(--text-secondary)',
                        }}>
                          {c.section}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {ens.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {ens.map((p) => (
                            <span key={p.idPers} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                              {p.nom} {p.prenom}{ens.indexOf(p) < ens.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.coefficient ? (
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '3px 8px', borderRadius: 6 }}>
                          {c.coefficient}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {c.heures ? (
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {c.heures}h
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(c)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(c)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un cours' : 'Modifier le cours'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField
              label="Libellé"
              required
              value={modal.values.libelle}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))}
            />
            <SelectField
              label="Classe"
              required
              options={(classes || []).map((c) => ({ value: c.idClasse, label: c.libelle }))}
              value={modal.values.idClasse}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idClasse: e.target.value } }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField
                label="Coefficient"
                type="number"
                value={modal.values.coefficient}
                onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, coefficient: e.target.value } }))}
              />
              <InputField
                label="Heures"
                type="number"
                value={modal.values.heures}
                onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, heures: e.target.value } }))}
              />
            </div>
            <InputField
              label="Description"
              value={modal.values.description || ''}
              onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, description: e.target.value } }))}
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

function TabButton({ active, onClick, accent, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13.5,
        padding: active ? '11px 22px 10px' : '10px 20px 9px',
        cursor: 'pointer', userSelect: 'none',
        borderRadius: '10px 10px 0 0',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--card-bg)' : 'var(--border-light)',
        position: 'relative', top: active ? 0 : 4,
        transition: 'top .16s ease, background .16s ease, color .16s ease',
        display: 'flex', alignItems: 'center', gap: 8,
        border: 'none', outline: 'none',
        boxShadow: active ? '0 -4px 10px rgba(0,0,0,0.06)' : 'none',
        zIndex: active ? 2 : 1,
      }}
    >
      {children}
    </button>
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


