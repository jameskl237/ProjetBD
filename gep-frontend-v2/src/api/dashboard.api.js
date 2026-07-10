import client from './client'
import { ENDPOINTS } from './endpoints'

export const dashboardApi = {
  stats: () => client.get(ENDPOINTS.dashboard.stats).then((r) => r.data),
}
