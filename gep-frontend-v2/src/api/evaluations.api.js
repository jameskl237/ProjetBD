import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const evaluationsApi = createResource(ENDPOINTS.evaluations.root)
export const sessionsApi = createResource(ENDPOINTS.evaluations.sessions)
export const epreuvesApi = createResource(ENDPOINTS.evaluations.epreuves)
export const naturesApi = createResource(ENDPOINTS.evaluations.natures)

export const evaluationValidationApi = {
  valider: (id) => client.put(`${ENDPOINTS.evaluations.root}/${id}/valider`).then((r) => r.data),
  rejeter: (id) => client.put(`${ENDPOINTS.evaluations.root}/${id}/rejeter`).then((r) => r.data),
}

export const epreuveValidationApi = {
  valider: (id) => client.put(`${ENDPOINTS.evaluations.epreuves}/${id}/valider`).then((r) => r.data),
  rejeter: (id) => client.put(`${ENDPOINTS.evaluations.epreuves}/${id}/rejeter`).then((r) => r.data),
}

export const bulletinApi = {
  get: (matricule) => client.get(ENDPOINTS.evaluations.bulletin(matricule)).then((r) => r.data),
  exportUrl: (matricule) => `${client.defaults.baseURL}${ENDPOINTS.evaluations.bulletinExport(matricule)}`,
}
