import { useEffect, useState } from 'react'
import { extractList } from '../api'

export default function useApiList(request, { mapper = item => item, initialData = [], enabled = true } = {}) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!enabled || !request) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await request()
        const rows = extractList(response)
        if (mounted) setData(rows.map(mapper))
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Erreur de chargement')
          setData([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [enabled, request, mapper])

  return { data, setData, loading, error }
}
