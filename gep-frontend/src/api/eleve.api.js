import api from './axios.config';
import { API_ENDPOINTS } from './endpoints';

const eleveApi = {
  list(params) {
    return api.get(API_ENDPOINTS.eleves, { params });
  },
  get(id) {
    return api.get(`${API_ENDPOINTS.eleves}/${id}`);
  },
  details(id) {
    return api.get(`${API_ENDPOINTS.eleves}/${id}`);
  },
  notes(id) {
    return api.get(`${API_ENDPOINTS.eleves}/${id}/notes`);
  },
  paiements(id) {
    return api.get(`${API_ENDPOINTS.eleves}/${id}/paiements`);
  },
  rapports(id) {
    return api.get(`${API_ENDPOINTS.eleves}/${id}/rapports`);
  },
  create(data) {
    return api.post(API_ENDPOINTS.eleves, data);
  },
  update(id, data) {
    return api.put(`${API_ENDPOINTS.eleves}/${id}`, data);
  },
  remove(id) {
    return api.delete(`${API_ENDPOINTS.eleves}/${id}`);
  },
};

export default eleveApi;
