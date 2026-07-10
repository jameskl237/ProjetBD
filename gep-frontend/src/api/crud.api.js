import api from './axios.config'
import { API_ENDPOINTS } from './endpoints'

export function extractData(response) {
  return response?.data?.data ?? response?.data
}

export function extractList(response) {
  const payload = extractData(response)
  if (Array.isArray(payload)) return normalizeApiList(payload)
  if (Array.isArray(payload?.paiements)) return normalizeApiList(payload.paiements)
  if (Array.isArray(payload?.items)) return normalizeApiList(payload.items)
  if (Array.isArray(payload?.rows)) return normalizeApiList(payload.rows)
  if (Array.isArray(payload?.results)) return normalizeApiList(payload.results)
  if (Array.isArray(payload?.content)) return normalizeApiList(payload.content)
  return []
}

export function getApiId(item) {
  return item?.id ?? item?.matricule ?? item?.idClasse ?? item?.idSalle ?? item?.idFrequente ?? item?.idAnnee ?? item?.idTrimes ?? item?.idPaie ?? item?.idMode ?? item?.idTranche ?? item?.idScolarite ?? item?.idCycle ?? item?.idPers ?? item?.idAbsence ?? item?.idAbonnement ?? item?.idTemps ?? item?.ID
}

export function normalizeApiItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item
  const id = getApiId(item)
  return id == null ? item : { id, ...item }
}

export function normalizeApiList(items) {
  return Array.isArray(items) ? items.map(normalizeApiItem) : []
}

export function createCrudApi(resource) {
  return {
    list(params) {
      return api.get(resource, { params })
    },
    get(id) {
      return api.get(`${resource}/${id}`)
    },
    create(data) {
      return api.post(resource, data)
    },
    update(id, data) {
      return api.put(`${resource}/${id}`, data)
    },
    remove(id) {
      return api.delete(`${resource}/${id}`)
    },
  }
}

export const classeApi = createCrudApi(API_ENDPOINTS.classes)
export const cycleApi = createCrudApi(API_ENDPOINTS.cycles)
export const salleApi = createCrudApi(API_ENDPOINTS.salles)
export const inscriptionApi = createCrudApi(API_ENDPOINTS.inscriptions)
export const anneeAcademiqueApi = createCrudApi(API_ENDPOINTS.anneesAcademiques)
export const trimestreApi = createCrudApi(API_ENDPOINTS.trimestres)
export const matiereApi = createCrudApi(API_ENDPOINTS.matieres)
export const enseignantApi = createCrudApi(API_ENDPOINTS.enseignants)
export const evaluationApi = createCrudApi(API_ENDPOINTS.evaluations)
export const noteApi = createCrudApi(API_ENDPOINTS.notes)
export const incidentApi = createCrudApi(API_ENDPOINTS.incidents)
export const sanctionApi = createCrudApi(API_ENDPOINTS.sanctions)
export const modePaiementApi = createCrudApi(API_ENDPOINTS.modesPaiement)
export const trancheApi = createCrudApi(API_ENDPOINTS.tranches)
export const scolariteApi = createCrudApi(API_ENDPOINTS.scolarites)
export const tuteurApi = createCrudApi(API_ENDPOINTS.tuteurs)
export const quartierApi = createCrudApi(API_ENDPOINTS.quartiers)
export const villeApi = createCrudApi(API_ENDPOINTS.villes)
export const parentApi = createCrudApi(API_ENDPOINTS.parents)
export const examenApi = createCrudApi(API_ENDPOINTS.examens)
export const annonceApi = createCrudApi(API_ENDPOINTS.annonces)
export const transportApi = createCrudApi(API_ENDPOINTS.transports)
export const sauvegardeApi = createCrudApi(API_ENDPOINTS.sauvegardes)
export const absenceApi = createCrudApi(API_ENDPOINTS.absences)
export const abonnementApi = createCrudApi(API_ENDPOINTS.abonnements)
export const emploiDuTempsApi = createCrudApi(API_ENDPOINTS.emploiDuTemps)
