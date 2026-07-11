import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const quartiersApi = createResource(ENDPOINTS.quartiers.root)

export const villesApi = {
  list: () => client.get(ENDPOINTS.quartiers.villes).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.quartiers.villes, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.quartiers.villes}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.quartiers.villes}/${id}`).then((r) => r.data),
}

export const residentsApi = {
  list: () => client.get(ENDPOINTS.quartiers.residents).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.quartiers.residents, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.quartiers.residents}/${id}`).then((r) => r.data),
}
