import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth.api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gep_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gep_token')
    if (!token) { setLoading(false); return }
    // Revalide la session au chargement (JWT expire à 24h côté backend).
    authApi.me()
      .then((payload) => {
        setUser((prev) => prev ?? {
          id: payload.id,
          nom: payload.nom,
          type: payload.type,
          typeAdmin: payload.typeAdmin,
          typePersonne: payload.typePersonne,
        })
      })
      .catch(() => {
        localStorage.removeItem('gep_token')
        localStorage.removeItem('gep_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (login, password) => {
    const { token, user: loggedUser } = await authApi.login(login, password)
    localStorage.setItem('gep_token', token)
    localStorage.setItem('gep_user', JSON.stringify(loggedUser))
    setUser(loggedUser)
    return loggedUser
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('gep_token')
    localStorage.removeItem('gep_user')
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
