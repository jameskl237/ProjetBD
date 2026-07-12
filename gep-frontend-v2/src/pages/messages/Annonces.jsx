import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useResource } from '../../hooks/useResource'
import { messagesApi } from '../../api/messages.api'
import { useAuth } from '../../hooks/useAuth'
import { getRoleKey, ROLES } from '../../config/navigation'

const CIBLE_OPTIONS = [
  { value: 'parents', label: 'Parents' },
  { value: 'enseignants', label: 'Enseignants' },
  { value: 'tous', label: 'Tous (Parents + Enseignants)' },
]

export default function Annonces() {
  const { data, loading, error, reload } = useResource(messagesApi)
  const { user } = useAuth()
  const roleKey = getRoleKey(user)
  const canCompose = roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE || roleKey === ROLES.ENSEIGNANT
  const [modal, setModal] = useState(null)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await messagesApi.create({
        cible: modal.values.cible,
        objet: modal.values.objet,
        information: modal.values.information,
      })
      setModal(null); reload()
    } catch (err) { setFormError(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'annonce') }
  }

  return (
    <div>
      <PageHeader
        title="Annonces"
        subtitle="Communications entre l'établissement et les familles"
        actions={canCompose ? <Button onClick={() => { setModal({ values: { cible: 'parents', objet: '', information: '' } }); setFormError('') }}>＋ Nouvelle annonce</Button> : null}
      />
      <Alert tone="error">{error}</Alert>
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { key: 'objet', label: 'Objet' },
            { key: 'expediteur', label: 'Expéditeur', render: (r) => r.expediteur ? `${r.expediteur.nom} ${r.expediteur.prenom}` : 'Administration' },
            { key: 'receiverRole', label: 'Destinataire', render: (r) => {
              if (r.receiverRole === 'enseignants') return <Badge tone="info">Enseignants</Badge>
              if (r.receiverRole === 'tous') return <Badge tone="success">Tous</Badge>
              return <Badge tone="warning">Parents</Badge>
            }},
            { key: 'created_at', label: 'Date', render: (r) => r.created_at?.slice(0, 10) },
            { key: 'valider', label: 'Statut', render: (r) => <Badge tone={r.valider ? 'success' : 'warning'}>{r.valider ? 'Validée' : 'En attente'}</Badge> },
            { key: 'isRead', label: 'Lu', render: (r) => <Badge tone={r.isRead ? 'info' : 'neutral'}>{r.isRead ? 'Oui' : 'Non'}</Badge> },
          ]}
          rows={data}
          loading={loading}
          keyField="idMessages"
          emptyLabel="Aucune annonce"
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {!row.isRead && <button onClick={async () => { await messagesApi.marquerLu(row.idMessages); reload() }} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Marquer lu</button>}
              {(roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE) && !row.valider && <button onClick={async () => { await messagesApi.valider(row.idMessages); reload() }} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Valider</button>}
              {(roleKey === ROLES.ADMINISTRATEUR || roleKey === ROLES.SECRETAIRE) && <button onClick={async () => { if (confirm('Supprimer cette annonce ?')) { await messagesApi.remove(row.idMessages); reload() } }} style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>Supprimer</button>}
            </div>
          )}
        />
      </Card>

      <Modal open={!!modal} title="Nouvelle annonce" onClose={() => setModal(null)}>
        {modal && (
          <form onSubmit={handleSubmit}>
            <Alert tone="error">{formError}</Alert>
            <SelectField label="Destinataires" required value={modal.values.cible} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, cible: e.target.value } }))}
              options={CIBLE_OPTIONS} />
            <InputField label="Objet" required value={modal.values.objet} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, objet: e.target.value } }))} />
            <InputField label="Message" required value={modal.values.information} onChange={(e) => setModal((m) => ({ ...m, values: { ...m.values, information: e.target.value } }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Annuler</Button>
              <Button type="submit">Publier l'annonce</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
