import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { classesApi, sallesApi } from '../../api/classes.api'
import { cyclesApi } from '../../api/scolarite.api'

export default function ClasseForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [values, setValues] = useState({ libelle: '', idCycle: '', idSalle: '' })
  const [cycles, setCycles] = useState([])
  const [salles, setSalles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cyclesApi.list().then(setCycles).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    classesApi.get(id).then((c) => setValues({ libelle: c.libelle, idCycle: c.idCycle, idSalle: c.salles?.[0]?.idSalle || '' }))
  }, [id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { libelle: values.libelle, idCycle: Number(values.idCycle), idSalle: values.idSalle ? Number(values.idSalle) : undefined }
      if (isEdit) await classesApi.update(id, payload)
      else await classesApi.create(payload)
      navigate('/classes')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Modifier la classe' : 'Nouvelle classe'} />
      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: 16 }}>
          <Alert tone="error">{error}</Alert>
          <InputField label="Libellé" required value={values.libelle} onChange={(e) => setValues((v) => ({ ...v, libelle: e.target.value }))} />
          <SelectField label="Cycle" required value={values.idCycle} onChange={(e) => setValues((v) => ({ ...v, idCycle: e.target.value }))}
            options={cycles.map((c) => ({ value: c.idCycle, label: c.libelle }))} />
          <SelectField label="Salle (libre)" required={!isEdit} value={values.idSalle} onChange={(e) => setValues((v) => ({ ...v, idSalle: e.target.value }))}
            options={salles.filter((s) => !s.idClasse || String(s.idClasse) === id).map((s) => ({ value: s.idSalle, label: s.libelle }))} />
        </Card>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/classes')}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}
