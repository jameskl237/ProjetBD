import { useEffect, useState, useMemo } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import { appreciationsApi } from '../../api/appreciations.api'

export default function Appreciations() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    appreciationsApi.list()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || 'Erreur'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
  }, [data])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (modal.mode === 'create') {
        await appreciationsApi.create(modal.values)
      } else {
        await appreciationsApi.update(modal.values.idAppreciation, modal.values)
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
    if (!confirm(`Supprimer l'appréciation "${row.grade}" ?`)) return
    try {
      await appreciationsApi.remove(row.idAppreciation)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible')
    }
  }

  if (loading) return <Spinner label="Chargement des appréciations…" />

  return (
    <div>
      <PageHeader
        title="Appréciations"
        subtitle="Barème officiel des appréciations (FR/EN)"
        actions={<Button onClick={() => setModal({ mode: 'create', values: { grade: '', libelleFr: '', libelleEn: '', descriptionFr: '', descriptionEn: '', noteMin: 0, noteMax: 20, ordre: 0 } })}>＋ Ajouter</Button>}
      />
      <Alert tone="error">{error}</Alert>

      <Card style={{ padding: 0, overflow: 'hidden', maxHeight: 520, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt, #f9fafb)', textAlign: 'left' }}>
              <th style={thStyle}>Grade</th>
              <th style={thStyle}>Libellé FR</th>
              <th style={thStyle}>Libellé EN</th>
              <th style={thStyle}>Description FR</th>
              <th style={thStyle}>Description EN</th>
              <th style={thStyle}>Notes</th>
              <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune appréciation configurée.</td></tr>
            )}
            {sorted.map((a) => (
              <tr key={a.idAppreciation} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>
                  <Badge tone="info" style={{ fontWeight: 800, fontSize: 14 }}>{a.grade}</Badge>
                </td>
                <td style={tdStyle}>{a.libelleFr}</td>
                <td style={tdStyle}>{a.libelleEn}</td>
                <td style={tdStyle}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.descriptionFr || '—'}</span></td>
                <td style={tdStyle}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.descriptionEn || '—'}</span></td>
                <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.noteMin} – {a.noteMax}</span></td>
                <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setModal({ mode: 'edit', values: { ...a } })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                    <button onClick={() => handleDelete(a)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter une appréciation' : 'Modifier l\'appréciation'} onClose={() => setModal(null)} width={600}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Grade (ex: A+, B, C+)" required value={modal.values.grade} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, grade: e.target.value } }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Libellé FR" required value={modal.values.libelleFr} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelleFr: e.target.value } }))} />
              <InputField label="Libellé EN" required value={modal.values.libelleEn} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelleEn: e.target.value } }))} />
            </div>
            <InputField label="Description FR" value={modal.values.descriptionFr || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, descriptionFr: e.target.value } }))} />
            <InputField label="Description EN" value={modal.values.descriptionEn || ''} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, descriptionEn: e.target.value } }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <InputField label="Note min" type="number" required value={modal.values.noteMin} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, noteMin: Number(e.target.value) } }))} />
              <InputField label="Note max" type="number" required value={modal.values.noteMax} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, noteMax: Number(e.target.value) } }))} />
              <InputField label="Ordre" type="number" value={modal.values.ordre || 0} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, ordre: Number(e.target.value) } }))} />
            </div>
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
