import api from './axios.config';
import { API_ENDPOINTS } from './endpoints';

const authApi = {
  login(credentials) {
    return api.post(API_ENDPOINTS.auth.login, {
      login: credentials.login ?? credentials.email,
      password: credentials.password,
    });
  },
  logout() {
    localStorage.removeItem('token');
    return Promise.resolve({ data: { message: 'Déconnecté' } });
  },
  profile() {
    return api.get(API_ENDPOINTS.auth.profile);
  },
};

export default authApi;
