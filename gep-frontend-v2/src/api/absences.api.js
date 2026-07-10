import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.absences)

export const absencesApi = {
  ...base,
  justifier: (id) => client.put(`${ENDPOINTS.absences}/${id}/justifier`).then((r) => r.data),
}
