import { createContext, useEffect, useState } from 'react'
import { authApi, extractData } from '../api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      fetchProfile(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  async function fetchProfile(authToken) {
    try {
      const response = await authApi.profile()
      const payload = extractData(response)
      setUser(payload?.user || payload)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch profile', err)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setError(err?.response?.data?.error || 'Session expired')
    } finally {
      setIsLoading(false)
    }
  }

  async function login(loginValue, password) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.login({ login: loginValue, password })
      const payload = extractData(response)
      const newToken = payload?.token
      const userData = payload?.user

      if (newToken) {
        localStorage.setItem('token', newToken)
        setToken(newToken)
        const resolvedUser = userData || { login: loginValue }
        setUser(resolvedUser)
        return { success: true, user: resolvedUser }
      }
      throw new Error('Aucun token retourné')
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Erreur de connexion'
      setError(errorMsg)
      setToken(null)
      setUser(null)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error', err)
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setError(null)
    }
  }

  const value = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
