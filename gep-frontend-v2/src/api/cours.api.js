import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const coursApi = createResource(ENDPOINTS.cours.root)
export const enseignantsApi = createResource(ENDPOINTS.cours.enseignants)
export const titulairesApi = createResource(ENDPOINTS.cours.titulaires)

export const emploiDuTempsApi = {
  list: (params) => client.get(ENDPOINTS.cours.emploiDuTemps, { params }).then((r) => r.data),
  create: (payload) => client.post(ENDPOINTS.cours.emploiDuTemps, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${ENDPOINTS.cours.emploiDuTemps}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${ENDPOINTS.cours.emploiDuTemps}/${id}`).then((r) => r.data),
}
