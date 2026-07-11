import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.admins)

export const adminsApi = {
  ...base,
  toggleActif: (id, actif) => client.put(`${ENDPOINTS.admins}/${id}/actif`, { actif }).then((r) => r.data),
}
