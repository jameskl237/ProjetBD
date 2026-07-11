import client from './client'

// Fabrique un service CRUD générique pour une ressource REST standard
// (GET /path, GET /path/:id, POST /path, PUT /path/:id, DELETE /path/:id).
// Reprend exactement les verbes/chemins exposés par chaque router Express du backend.
export function createResource(path) {
  return {
    list: (params) => client.get(path, { params }).then((r) => r.data),
    get: (id) => client.get(`${path}/${id}`).then((r) => r.data),
    create: (payload) => client.post(path, payload).then((r) => r.data),
    update: (id, payload) => client.put(`${path}/${id}`, payload).then((r) => r.data),
    remove: (id) => client.delete(`${path}/${id}`).then((r) => r.data),
  }
}
