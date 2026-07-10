// useFetch.js - Hook générique pour les requêtes API
import { useState, useEffect } from 'react';
import api from '../api/axios.config';
import { extractData } from '../api';

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    api.get(url)
      .then(res => setData(extractData(res)))
      .catch(err => setError(err?.response?.data?.error || err?.response?.data?.message || err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
