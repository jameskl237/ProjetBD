import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import { bulletinsApi } from '../../api/bulletins.api'

export default function BulletinsAdmin() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    bulletinsApi.list()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || 'Erreur'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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

  async function toggleEtat(row) {
    try {
      await bulletinsApi.update(row.idBulletin, { etat: row.etat === 1 ? 0 : 1 })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Supprimer le bulletin "${row.libelle}" ?`)) return
    try {
      await bulletinsApi.remove(row.idBulletin)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Suppression impossible')
    }
  }

  if (loading) return <Spinner label="Chargement des bulletins…" />

  return (
    <div>
      <PageHeader
        title="Bulletins"
        subtitle="Gestion de la publication des bulletins"
        actions={<Button onClick={() => setModal({ mode: 'create', values: { libelle: '', etat: 0 } })}>＋ Nouveau bulletin</Button>}
      />
      <Alert tone="error">{error}</Alert>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt, #f9fafb)', textAlign: 'left' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Libellé</th>
              <th style={thStyle}>État</th>
              <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun bulletin.</td></tr>
            )}
            {data?.map((b, i) => (
              <tr key={b.idBulletin} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={tdStyle}>{i + 1}</td>
                <td style={tdStyle}><span style={{ fontWeight: 600 }}>{b.libelle}</span></td>
                <td style={tdStyle}>
                  <Badge tone={b.etat === 1 ? 'success' : 'warning'}>
                    {b.etat === 1 ? 'Publié' : 'Brouillon'}
                  </Badge>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 16 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => toggleEtat(b)} style={{ color: b.etat === 1 ? 'var(--warning)' : 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                      {b.etat === 1 ? 'Dépublier' : 'Publier'}
                    </button>
                    <button onClick={() => setModal({ mode: 'edit', values: { ...b } })} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
                    <button onClick={() => handleDelete(b)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Nouveau bulletin' : 'Modifier le bulletin'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <InputField label="Libellé" required value={modal.values.libelle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, libelle: e.target.value } }))} />
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
