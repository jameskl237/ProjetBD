import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.classes)

export const classesApi = {
  ...base,
  eleves: (idClasse) => client.get(`${ENDPOINTS.classes}/${idClasse}/eleves`).then((r) => r.data),
}

export const sallesApi = createResource(ENDPOINTS.salles)
