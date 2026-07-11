import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.eleves)

export const elevesApi = {
  ...base,
  paiements: (matricule) => client.get(`${ENDPOINTS.eleves}/${matricule}/paiements`).then((r) => r.data),
  notes: (matricule) => client.get(`${ENDPOINTS.eleves}/${matricule}/notes`).then((r) => r.data),
  inscriptions: (matricule) => client.get(`${ENDPOINTS.eleves}/${matricule}/inscriptions`).then((r) => r.data),
  rapports: (matricule) => client.get(`${ENDPOINTS.eleves}/${matricule}/rapports`).then((r) => r.data),
}
