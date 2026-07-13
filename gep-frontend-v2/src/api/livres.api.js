import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const livresApi = createResource(ENDPOINTS.livres.root)

export const specialitesApi = {
  list: () => client.get(ENDPOINTS.livres.specialites).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.livres.specialites, payload).then((r) => r.data),
}

export const stockApi = {
  list: () => client.get(ENDPOINTS.livres.stock).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.livres.stock, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.livres.stock}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.livres.stock}/${id}`).then((r) => r.data),
}
