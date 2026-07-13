import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { classesApi, sallesApi } from '../../api/classes.api'
import { cyclesApi } from '../../api/scolarite.api'
import { enseignantsLibresApi } from '../../api/cours.api'

export default function ClasseForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [values, setValues] = useState({ libelle: '', idCycle: '', idSalle: '', titulaire: '' })
  const [cycles, setCycles] = useState([])
  const [salles, setSalles] = useState([])
  const [enseignantsBruts, setEnseignantsBruts] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cyclesApi.list().then(setCycles).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
    const params = isEdit ? { excludeClassId: id } : undefined
    enseignantsLibresApi.list(params).then(setEnseignantsBruts).catch(() => {})
  }, [id, isEdit])

  useEffect(() => {
    if (!isEdit) return
    classesApi.get(id).then((c) => {
      setValues({
        libelle: c.libelle,
        idCycle: c.idCycle,
        idSalle: c.salles?.[0]?.idSalle || '',
        titulaire: c.titulaire?.idPers || '',
      })
    })
  }, [id, isEdit])

  const enseignantsUniques = useMemo(() => {
    const byPers = new Map()
    enseignantsBruts.forEach((e) => {
      if (!e.idPers) return
      if (!byPers.has(e.idPers)) {
        byPers.set(e.idPers, { idPers: e.idPers, nom: e.nom, prenom: e.prenom, cycles: new Map() })
      }
      const entry = byPers.get(e.idPers)
      if (e.cycleId) entry.cycles.set(e.cycleId, e.cycleNom)
    })
    return Array.from(byPers.values())
      .filter((e) => !values.idCycle || e.cycles.has(Number(values.idCycle)))
      .map((e) => {
        const nom = `${e.nom || ''} ${e.prenom || ''}`.trim() || `#${e.idPers}`
        const cycleLabels = [...e.cycles.values()]
        return {
          value: e.idPers,
          label: cycleLabels.length <= 2 ? nom : `${nom} (${cycleLabels.join(', ')})`,
          sub: cycleLabels.join(', '),
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [enseignantsBruts, values.idCycle])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        libelle: values.libelle,
        idCycle: Number(values.idCycle),
        idSalle: values.idSalle ? Number(values.idSalle) : undefined,
        titulaire: values.titulaire ? Number(values.titulaire) : null,
      }
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
          <SelectField label="Cycle" required value={values.idCycle} onChange={(e) => setValues((v) => ({ ...v, idCycle: e.target.value, titulaire: '' }))}
            options={cycles.map((c) => ({ value: c.idCycle, label: c.libelle }))} />
          <SelectField label="Salle (libre)" required={!isEdit} value={values.idSalle} onChange={(e) => setValues((v) => ({ ...v, idSalle: e.target.value }))}
            options={salles.filter((s) => !s.idClasse || String(s.idClasse) === id).map((s) => ({ value: s.idSalle, label: s.libelle }))} />
          <SelectField
            label={values.idCycle ? `Titulaire (section ${cycles.find((c) => c.idCycle === Number(values.idCycle))?.libelle || ''})` : 'Titulaire (enseignant)'}
            placeholder={values.idCycle ? `— Sélectionner dans cette section —` : '— Choisir d\'abord un cycle —'}
            value={values.titulaire}
            onChange={(e) => setValues((v) => ({ ...v, titulaire: e.target.value }))}
            options={enseignantsUniques}
          />
          {values.idCycle && enseignantsUniques.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
              {enseignantsUniques.length} enseignant{enseignantsUniques.length > 1 ? 's' : ''} disponible{enseignantsUniques.length > 1 ? 's' : ''}
            </div>
          )}
          {values.idCycle && enseignantsUniques.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
              Aucun enseignant disponible pour cette section
            </div>
          )}
        </Card>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/classes')}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}
