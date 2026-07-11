import { useEffect, useState, useMemo, useCallback } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import { enseignantsApi, coursApi } from '../../api/cours.api'
import { useAuth } from '../../hooks/useAuth'

export default function EnseignantCours() {
  const { user } = useAuth()
  const [mesCours, setMesCours] = useState(null)
  const [filterClasse, setFilterClasse] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [allCours, setAllCours] = useState([])

  const reload = useCallback(() => {
    enseignantsApi.list()
      .then((rows) => setMesCours(rows.filter((r) => r.idPers === user.id)))
      .catch(() => setMesCours([]))
  }, [user])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    coursApi.list().then(setAllCours).catch(() => {})
  }, [])

  const classes = useMemo(() => {
    if (!mesCours) return []
    const map = new Map()
    mesCours.forEach((c) => {
      const cl = c.cours?.classe
      if (cl?.idClasse) map.set(cl.idClasse, cl.libelle)
    })
    return [...map.entries()].map(([id, libelle]) => ({ id, libelle }))
  }, [mesCours])

  const filtered = useMemo(() => {
    if (!mesCours) return []
    if (!filterClasse) return mesCours
    return mesCours.filter((c) => c.cours?.classe?.idClasse === Number(filterClasse))
  }, [mesCours, filterClasse])

  const stats = useMemo(() => {
    if (!mesCours) return { total: 0, classes: 0 }
    const total = filtered.length
    const classesCount = new Set(filtered.map((c) => c.cours?.classe?.idClasse).filter(Boolean)).size
    return { total, classes: classesCount }
  }, [mesCours, filtered])

  const openCreate = () => {
    setFormError('')
    setModal({ mode: 'create', idCours: '' })
  }

  const openEdit = (row) => {
    setFormError('')
    setModal({ mode: 'edit', idEnseignant: row.idEnseignant, idCours: row.cours?.idCours ?? '' })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (modal.mode === 'create') {
        await enseignantsApi.create({ idPers: user.id, idCours: Number(modal.idCours) })
      } else {
        await enseignantsApi.update(modal.idEnseignant, { idCours: Number(modal.idCours) })
      }
      setModal(null)
      reload()
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (row) => {
    if (!window.confirm(`Retirer "${row.cours?.libelle}" de vos cours ?`)) return
    enseignantsApi.remove(row.idEnseignant)
      .then(() => reload())
      .catch(() => alert('Erreur lors de la suppression'))
  }

  if (mesCours === null) return <Spinner label="Chargement de vos cours…" />

  return (
    <div>
      <PageHeader
        title="Mes cours"
        subtitle={`${mesCours.length} cours répartis sur ${classes.length} classe${classes.length > 1 ? 's' : ''}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon="📚" label="Total cours" value={stats.total} tone="info" />
        <StatCard icon="🏫" label="Classe" value={stats.classes} tone="warning" />
      </div>

      <Card style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SelectField
          placeholder="Toutes les classes"
          options={classes.map((c) => ({ value: c.id, label: c.libelle }))}
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ width: 220, marginBottom: 0 }}
        />
        {filterClasse && (
          <button
            onClick={() => setFilterClasse('')}
            style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Effacer filtre
          </button>
        )}
        <div style={{ flex: 1 }} />
        <Button onClick={openCreate}>+ Ajouter un cours</Button>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Cours</th>
              <th style={thStyle}>Classe</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Coeff.</th>
              <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun cours trouvé.</td></tr>
            )}
            {filtered.map((c, i) => (
              <tr key={c.idEnseignant} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, fontWeight: 700,
                    background: 'var(--accent-light)', color: 'var(--accent)',
                  }}>{i + 1}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 18, background: 'var(--info-light)', flexShrink: 0,
                    }}>📖</span>
                    <span style={{ fontWeight: 600 }}>{c.cours?.libelle || '—'}</span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                    background: 'var(--info-light)', color: 'var(--info)',
                  }}>{c.cours?.classe?.libelle || '—'}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{c.cours?.coefficient || '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => openEdit(c)} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(c)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        {filtered.length} cours affiché{filtered.length > 1 ? 's' : ''}{filterClasse ? ` sur ${mesCours.length}` : ''}
      </div>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un cours' : 'Modifier l\'affectation'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSave}>
            <Alert tone="error">{formError}</Alert>
            <SelectField
              label="Cours"
              required
              options={allCours.map((c) => ({ value: c.idCours, label: `${c.libelle} — ${c.classe?.libelle || ''}` }))}
              value={modal.idCours}
              onChange={(e) => setModal((m) => ({ ...m, idCours: e.target.value }))}
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

const thStyle = { padding: '12px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', borderBottom: '1px solid var(--border)' }
const tdStyle = { padding: '12px 14px', verticalAlign: 'middle' }
