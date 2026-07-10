import api from './axios.config'
import { API_ENDPOINTS } from './endpoints'

const paiementApi = {
  list(params) {
    return api.get(API_ENDPOINTS.paiements, { params })
  },
  get(id) {
    return api.get(`${API_ENDPOINTS.paiements}/${id}`)
  },
  create(data) {
    return api.post(API_ENDPOINTS.paiements, data)
  },
  update(id, data) {
    return api.put(`${API_ENDPOINTS.paiements}/${id}`, data)
  },
  remove(id) {
    return api.delete(`${API_ENDPOINTS.paiements}/${id}`)
  },
}

export default paiementApi
