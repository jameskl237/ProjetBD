import client from './client'
import { ENDPOINTS } from './endpoints'
import { createResource } from './resource'

export const paiementsApi = createResource(ENDPOINTS.paiements.root)

export const modesApi = {
  list: () => client.get(ENDPOINTS.paiements.modes).then((r) => r.data),
}

export const paiementsExtra = {
  impayes: () => client.get(ENDPOINTS.paiements.impayes).then((r) => r.data),
  statut: (matricule) => client.get(ENDPOINTS.paiements.statut(matricule)).then((r) => r.data),
  parEleve: (matricule) => client.get(ENDPOINTS.paiements.parEleve(matricule)).then((r) => r.data),
  fixTranches: () => client.post(ENDPOINTS.paiements.fixTranches).then((r) => r.data),
  exportUrl: (params) => {
    const qs = new URLSearchParams(params || {}).toString()
    return `${client.defaults.baseURL}${ENDPOINTS.paiements.export}${qs ? `?${qs}` : ''}`
  },
  openRecu: (id) => {
    client.get(ENDPOINTS.paiements.recu(id), { responseType: 'blob' }).then((res) => {
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    })
  },
}
