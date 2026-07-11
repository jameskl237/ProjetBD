import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { coursApi, enseignantsApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'

const SECTION_TONES = {
  Anglophone: 'info',
  Francophone: 'success',
  Bilingue: 'warning',
  Bilingual: 'warning',
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
      if (!id) return
      if (!map[id]) map[id] = []
      if (e.personne) map[id].push(e.personne)
    })
    return map
  }, [enseignants])

  const filtered = useMemo(() => {
    if (!cours) return []
    let list = cours
    if (filterSection) list = list.filter((c) => c.section === filterSection)
    if (filterClasse) list = list.filter((c) => c.classe?.idClasse === Number(filterClasse))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c) =>
        c.libelle?.toLowerCase().includes(q) ||
        c.classe?.libelle?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        coursEnseignants[c.idCours]?.some((p) => `${p.nom} ${p.prenom}`.toLowerCase().includes(q))
      )
    }
    return list
  }, [cours, filterSection, filterClasse, search, coursEnseignants])

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

  const sectionIcon = (s) => {
    if (s?.toLowerCase().includes('anglo')) return '🇬🇧'
    if (s?.toLowerCase().includes('franc')) return '🇫🇷'
    if (s?.toLowerCase().includes('bil')) return '🌍'
    return '📖'
  }

  return (
    <div>
      <PageHeader
        title="Cours / Matières"
        subtitle={`${stats.total} cours répartis sur ${sections.length} sections`}
        actions={<Button onClick={openCreate}>＋ Ajouter</Button>}
      />
      <Alert tone="error">{error}</Alert>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📚" label="Total cours" value={stats.total} tone="info" />
        {Object.entries(stats.bySection).map(([section, nb]) => (
          <StatCard key={section} icon={sectionIcon(section)} label={section} value={nb} tone={SECTION_TONES[section] || 'neutral'} />
        ))}
      </div>

      {/* ── Filters ── */}
      <Card style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <InputField
          placeholder="Rechercher un cours, classe, enseignant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', marginBottom: 0 }}
        />
        <SelectField
          placeholder="Toutes les sections"
          options={sections.map((s) => ({ value: s, label: s }))}
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          style={{ width: 180, marginBottom: 0 }}
        />
        <SelectField
          placeholder="Toutes les classes"
          options={(classes || []).map((c) => ({ value: c.idClasse, label: c.libelle }))}
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ width: 200, marginBottom: 0 }}
        />
        {(search || filterSection || filterClasse) && (
          <button
            onClick={() => { setSearch(''); setFilterSection(''); setFilterClasse('') }}
            style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Effacer filtres
          </button>
        )}
      </Card>

      {/* ── Table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt, #f9fafb)', textAlign: 'left' }}>
              <th style={thStyle}>Cours</th>
              <th style={thStyle}>Classe</th>
              <th style={thStyle}>Section</th>
              <th style={thStyle}>Enseignant(s)</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Heures</th>
              <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun cours trouvé.</td></tr>
            )}
            {filtered.map((c) => {
              const ens = coursEnseignants[c.idCours] || []
              return (
                <tr key={c.idCours} style={{ borderTop: '1px solid var(--border-light)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{c.libelle}</div>
                    {c.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.description.slice(0, 60)}{c.description.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td style={tdStyle}>{c.classe?.libelle || `#${c.idClasse}`}</td>
                  <td style={tdStyle}>
                    <Badge tone={SECTION_TONES[c.section] || 'neutral'}>
                      {sectionIcon(c.section)} {c.section || '—'}
                    </Badge>
                  </td>
                  <td style={tdStyle}>
                    {ens.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    {ens.map((p) => (
                      <div key={p.idPers} style={{ fontSize: 13 }}>{p.nom} {p.prenom}</div>
                    ))}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{c.coefficient || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{c.heures || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(c)} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                      <button onClick={() => handleDelete(c)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        Affichage {filtered.length} / {stats.total} cours
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

const thStyle = { padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4 }
const tdStyle = { padding: '11px 14px', verticalAlign: 'top' }
