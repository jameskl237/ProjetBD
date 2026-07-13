import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import { sallesApi } from '../../api/classes.api'

export default function SallesForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [values, setValues] = useState({ libelle: '', position: '', surface: '', capacite: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    sallesApi.get(id).then((s) => {
      setValues({
        libelle: s.libelle || '',
        position: s.position || '',
        surface: s.surface || '',
        capacite: s.capacite ?? '',
      })
    }).catch(() => setError('Salle introuvable'))
  }, [id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        libelle: values.libelle,
        position: values.position,
        surface: values.surface,
        capacite: values.capacite !== '' ? Number(values.capacite) : null,
      }
      if (isEdit) await sallesApi.update(id, payload)
      else await sallesApi.create(payload)
      navigate('/salles')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Modifier la salle' : 'Nouvelle salle'} />
      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: 16 }}>
          <Alert tone="error">{error}</Alert>
          <InputField label="Libellé" required value={values.libelle} onChange={(e) => setValues((v) => ({ ...v, libelle: e.target.value }))} />
          <InputField label="Position" value={values.position} onChange={(e) => setValues((v) => ({ ...v, position: e.target.value }))} />
          <InputField label="Surface" value={values.surface} onChange={(e) => setValues((v) => ({ ...v, surface: e.target.value }))} />
          <InputField label="Capacité" type="number" value={values.capacite} onChange={(e) => setValues((v) => ({ ...v, capacite: e.target.value }))} />
        </Card>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/salles')}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}
