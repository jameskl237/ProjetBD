import { useCallback, useEffect, useState } from 'react'

// Hook générique pour piloter une ressource CRUD (liste + mutations) contre
// n'importe quel service créé par api/resource.js#createResource, en gérant
// loading/erreur/rafraîchissement de façon uniforme sur toutes les pages.
export function useResource(service, params) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    return service.list(params)
      .then((res) => setData(Array.isArray(res) ? res : res?.data ?? []))
      .catch((err) => setError(err.response?.data?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)])

  useEffect(() => { reload() }, [reload])

  return { data, setData, loading, error, reload }
}
