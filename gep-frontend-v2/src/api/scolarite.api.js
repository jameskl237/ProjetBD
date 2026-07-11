import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const scolariteApi = createResource(ENDPOINTS.scolarite.root)
export const cyclesApi = createResource(ENDPOINTS.scolarite.cycles)

export const scolariteClassesApi = {
  list: () => client.get(ENDPOINTS.scolarite.classes).then((r) => r.data),
}

export const tranchesApi = {
  list: (params) => client.get(ENDPOINTS.scolarite.tranches, { params }).then((r) => r.data),
}
