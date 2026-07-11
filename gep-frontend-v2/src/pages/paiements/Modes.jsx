import SimpleCrudPage from '../../components/crud/SimpleCrudPage'
import { modesApi } from '../../api/paiements.api'
import client from '../../api/client'
import { ENDPOINTS } from '../../api/endpoints'

const modesResource = {
  list: modesApi.list,
  create: (payload) => client.post(ENDPOINTS.paiements.modesBase, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.paiements.modesBase}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.paiements.modesBase}/${id}`).then((r) => r.data),
}

export default function Modes() {
  return (
    <SimpleCrudPage
      title="Modes de paiement"
      subtitle="Moyens de règlement acceptés par l'établissement"
      service={modesResource}
      idField="idMode"
      columns={[
        { key: 'libelle', label: 'Libellé' },
        { key: 'information', label: 'Information' },
      ]}
      fields={[
        { name: 'libelle', label: 'Libellé', required: true },
        { name: 'information', label: 'Information' },
      ]}
    />
  )
}
