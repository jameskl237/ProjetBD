import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.personnes.root)

export const personnesApi = {
  ...base,
  me: () => client.get(ENDPOINTS.personnes.me).then((r) => r.data),
  updateMe: (payload) => client.put(ENDPOINTS.personnes.me, payload).then((r) => r.data),
}
