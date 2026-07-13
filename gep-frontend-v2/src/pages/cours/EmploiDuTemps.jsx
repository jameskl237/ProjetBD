import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import { useResource } from '../../hooks/useResource'
import { emploiDuTempsApi, coursApi } from '../../api/cours.api'
import { classesApi, sallesApi } from '../../api/classes.api'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const CRENEAUX = [
  { value: '07:30', label: '07h30 – 08h00' },
  { value: '08:00', label: '08h00 – 08h30' },
  { value: '08:30', label: '08h30 – 09h00' },
  { value: '09:00', label: '09h00 – 09h30' },
  { value: '10:00', label: '10h00 – 10h30 (après pause)' },
  { value: '10:30', label: '10h30 – 11h00' },
  { value: '11:00', label: '11h00 – 11h30' },
  { value: '11:30', label: '11h30 – 12h00' },
  { value: '12:30', label: '12h30 – 13h00 (après pause)' },
  { value: '13:00', label: '13h00 – 13h30' },
  { value: '13:30', label: '13h30 – 14h00' },
  { value: '14:00', label: '14h00 – 14h30' },
  { value: '14:30', label: '14h30 – 15h00' },
  { value: '15:00', label: '15h00 – 15h30' },
  { value: '15:30', label: '15h30 – 16h00' },
]

export default function EmploiDuTemps() {
  const { data, loading, error, reload } = useResource(emploiDuTempsApi)
  const [classes, setClasses] = useState([])
  const [cours, setCours] = useState([])
  const [salles, setSalles] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    classesApi.list().then(setClasses).catch(() => {})
    coursApi.list().then(setCours).catch(() => {})
    sallesApi.list().then(setSalles).catch(() => {})
  }, [])

  function nameOf(list, id, key = 'libelle', idKey) {
    return list.find((x) => x[idKey] === id)?.[key] || `#${id}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      const payload = {
        jour: modal.values.jour, heure: modal.values.heure,
        idClasse: Number(modal.values.idClasse), idCours: Number(modal.values.idCours),
        idSalle: modal.values.idSalle ? Number(modal.values.idSalle) : undefined,
      }
      if (modal.mode === 'edit') await emploiDuTempsApi.update(modal.values.idTemps, payload)
      else await emploiDuTempsApi.create(payload)
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Conflit ou données invalides') }
  }

  return (
    <div>
      <PageHeader
        title="Emploi du temps"
        subtitle="Planning hebdomadaire des cours par classe"
        actions={<Button onClick={() => setModal({ mode: 'create', values: { jour: 'Lundi', heure: '', idClasse: '', idCours: '', idSalle: '' } })}>＋ Ajouter un créneau</Button>}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'jour', label: 'Jour' },
            { key: 'heure', label: 'Heure' },
            { key: 'idClasse', label: 'Classe', render: (r) => nameOf(classes, r.idClasse, 'libelle', 'idClasse') },
            { key: 'idCours', label: 'Cours', render: (r) => nameOf(cours, r.idCours, 'libelle', 'idCours') },
            { key: 'idSalle', label: 'Salle', render: (r) => r.idSalle ? nameOf(salles, r.idSalle, 'libelle', 'idSalle') : '—' },
          ]}
          rows={data}
          loading={loading}
          keyField="idTemps"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal({ mode: 'edit', values: row }); setFormError('') }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Modifier</button>
              <button onClick={async () => { if (confirm('Supprimer ce créneau ?')) { await emploiDuTempsApi.remove(row.idTemps); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
            </div>
          )}
        />
      </Card>

      <Modal open={!!modal} title={modal?.mode === 'create' ? 'Ajouter un créneau' : 'Modifier le créneau'} onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Jour" required value={modal.values.jour} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, jour: e.target.value } }))}
              options={JOURS.map((j) => ({ value: j, label: j }))} />
            <SelectField label="Créneau horaire" required value={modal.values.heure} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, heure: e.target.value } }))}
              options={CRENEAUX} />
            <SelectField label="Classe" required value={modal.values.idClasse} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idClasse: e.target.value } }))}
              options={classes.map((c) => ({ value: c.idClasse, label: c.libelle }))} />
            <SelectField label="Cours" required value={modal.values.idCours} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={cours.map((c) => ({ value: c.idCours, label: c.libelle }))} />
            <SelectField label="Salle" value={modal.values.idSalle} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idSalle: e.target.value } }))}
              options={salles.map((s) => ({ value: s.idSalle, label: s.libelle }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
