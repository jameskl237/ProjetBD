import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const abonnementsApi = createResource(ENDPOINTS.transport.abonnements)
