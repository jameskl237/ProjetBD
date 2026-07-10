import api from './axios.config';
import { API_ENDPOINTS } from './endpoints';

const compteApi = {
  get() {
    return api.get(API_ENDPOINTS.compte.get);
  },
  update(data) {
    return api.put(API_ENDPOINTS.compte.update, data);
  },
};

export default compteApi;
