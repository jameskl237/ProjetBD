import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const parentsApi = createResource(ENDPOINTS.parents.root)
export const rapportsApi = createResource(ENDPOINTS.parents.rapports)
export const disciplinesApi = {
  list: () => client.get(ENDPOINTS.parents.disciplines).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.parents.disciplines, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.parents.disciplines}/${id}`, payload).then((r) => r.data),
}
