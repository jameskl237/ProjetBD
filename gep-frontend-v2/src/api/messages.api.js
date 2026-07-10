import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

const base = createResource(ENDPOINTS.messages)

export const messagesApi = {
  ...base,
  marquerLu: (id) => client.put(`${ENDPOINTS.messages}/${id}/lire`).then((r) => r.data),
  valider: (id) => client.put(`${ENDPOINTS.messages}/${id}/valider`).then((r) => r.data),
}
