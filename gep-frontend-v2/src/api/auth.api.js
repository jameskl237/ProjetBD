import client from './client'
import { ENDPOINTS } from './endpoints'

export const authApi = {
  login: (login, password) => client.post(ENDPOINTS.auth.login, { login, password }).then((r) => r.data),
  me: () => client.get(ENDPOINTS.auth.me).then((r) => r.data),
}
