import { useState } from 'react'
import PageHeader from '../layout/PageHeader'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import Modal from '../ui/Modal'
import Alert from '../ui/Alert'
import InputField from '../forms/InputField'
import SelectField from '../forms/SelectField'
import { useResource } from '../../hooks/useResource'

// Page CRUD générique (liste + création + édition + suppression via modal),
// pilotée par une description déclarative. Utilisée pour toutes les ressources
// de référence simples du backend (villes, quartiers, spécialités, modes de
// paiement, cycles, tranches, trimestres, salles, sessions, épreuves, etc.)
// afin d'éviter de dupliquer 20 fois la même mécanique liste/formulaire/modal.
export default function SimpleCrudPage({
  title, subtitle, service, columns, fields, idField = 'id',
  canCreate = true, canEdit = true, canDelete = true, params,
}) {
  const { data, loading, error, reload } = useResource(service, params)
  const [modal, setModal] = useState(null) // { mode: 'create'|'edit', values }
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function openCreate() {
    const empty = {}
    fields.forEach((f) => { empty[f.name] = f.default ?? '' })
    setModal({ mode: 'create', values: empty })
    setFormError('')
  }

  function openEdit(row) {
    setModal({ mode: 'edit', values: { ...row } })
    setFormError('')
  }

  async function handleDelete(row) {
    if (!confirm('Confirmer la suppression ?')) return
    try {
      await service.remove(row[idField])
      reload()
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
        await service.create(modal.values)
      } else {
        await service.update(modal.values[idField], modal.values)
      }
      setModal(null)
      reload()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={canCreate ? <Button onClick={openCreate}>＋ Ajouter</Button> : null}
      />
      <Card style={{ padding: 0 }}>
        <div style={{ padding: 18 }}>
          <Alert tone="error">{error}</Alert>
        </div>
        <Table
          columns={columns}
          rows={data}
          loading={loading}
          keyField={idField}
          actions={(canEdit || canDelete) ? (row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {canEdit && <button onClick={() => openEdit(row)} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>}
              {canDelete && <button onClick={() => handleDelete(row)} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
            </div>
          ) : null}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? `Ajouter — ${title}` : `Modifier — ${title}`} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            {fields.map((f) => (
              f.type === 'select' ? (
                <SelectField
                  key={f.name}
                  label={f.label}
                  options={f.options || []}
                  required={f.required}
                  value={modal.values[f.name] ?? ''}
                  onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, [f.name]: e.target.value } }))}
                />
              ) : (
                <InputField
                  key={f.name}
                  label={f.label}
                  type={f.type || 'text'}
                  required={f.required}
                  value={modal.values[f.name] ?? ''}
                  onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, [f.name]: e.target.value } }))}
                />
              )
            ))}
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
