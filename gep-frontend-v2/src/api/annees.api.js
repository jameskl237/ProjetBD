import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const anneesApi = createResource(ENDPOINTS.annees.root)

export const trimestresApi = {
  list: () => client.get(ENDPOINTS.annees.trimestres).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.annees.trimestres, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.annees.trimestres}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.annees.trimestres}/${id}`).then((r) => r.data),
}

export const inscriptionsApi = {
  list: () => client.get(ENDPOINTS.annees.inscriptions).then((r) => r.data),
  get: (id) => client.get(`${ENDPOINTS.annees.inscriptions}/${id}`).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.annees.inscriptions, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.annees.inscriptions}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.annees.inscriptions}/${id}`).then((r) => r.data),
}
