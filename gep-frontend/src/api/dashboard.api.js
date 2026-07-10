import api from './axios.config'

const dashboardApi = {
  stats() {
    return api.get('/dashboard/stats')
  },
}

export default dashboardApi
