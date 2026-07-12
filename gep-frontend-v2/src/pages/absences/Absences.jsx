import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import SelectField from '../../components/forms/SelectField'
import InputField from '../../components/forms/InputField'
import { useResource } from '../../hooks/useResource'
import { absencesApi } from '../../api/absences.api'
import { coursApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

export default function Absences() {
  const { data, loading, error, reload } = useResource(absencesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const isEnseignant = roleKey === ROLES.ENSEIGNANT
  const isAdmin = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE

  const [cours, setCours] = useState([])
  const [eleves, setEleves] = useState([])
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => { coursApi.list().then(setCours).catch(() => {}) }, [])

  useEffect(() => {
    if (!modal?.values.idCours) { setEleves([]); return }
    const c = cours.find((c) => c.idCours === Number(modal.values.idCours))
    if (!c) return
    classesApi.eleves(c.idClasse).then(setEleves).catch(() => setEleves([]))
  }, [modal?.values.idCours, cours])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await absencesApi.create({
        matricule: Number(modal.values.matricule), idCours: Number(modal.values.idCours),
        date: modal.values.date, commentaire: modal.values.commentaire, justifiee: false,
      })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur') }
  }

  return (
    <div>
      <PageHeader
        title="Absences"
        subtitle="Suivi des absences par cours"
        actions={isEnseignant ? <Button onClick={() => { setModal({ values: { idCours: '', matricule: '', date: new Date().toISOString().slice(0, 10), commentaire: '' } }); setFormError('') }}>＋ Signaler une absence</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'eleve', label: 'Élève', render: (r) => r.eleve ? `${r.eleve.nom} ${r.eleve.prenom}` : `#${r.matricule}` },
            { key: 'cours', label: 'Cours', render: (r) => r.cours?.libelle || '—' },
            { key: 'date', label: 'Date', render: (r) => r.date?.slice(0, 10) },
            { key: 'justifiee', label: 'Statut', render: (r) => <Badge tone={r.justifiee ? 'success' : 'warning'}>{r.justifiee ? 'Justifiée' : 'Non justifiée'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idAbsence"
          emptyLabel="Aucune absence enregistrée"
          actions={isAdmin ? (row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {!row.justifiee && <button onClick={async () => { await absencesApi.justifier(row.idAbsence); reload() }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Justifier</button>}
              <button onClick={async () => { if (confirm('Supprimer ?')) { await absencesApi.remove(row.idAbsence); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>
            </div>
          ) : null}
        />
      </Card>

      <Modal open={!!modal} title="Signaler une absence" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Cours" required value={modal.values.idCours} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, idCours: e.target.value } }))}
              options={cours.map((c) => ({ value: c.idCours, label: c.libelle }))} />
            <SelectField label="Élève" required value={modal.values.matricule} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, matricule: e.target.value } }))}
              options={eleves.map((e) => ({ value: e.matricule, label: `${e.nom} ${e.prenom}` }))} />
            <InputField label="Date" type="date" required value={modal.values.date} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, date: e.target.value } }))} />
            <InputField label="Commentaire" value={modal.values.commentaire} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, commentaire: e.target.value } }))} />
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
