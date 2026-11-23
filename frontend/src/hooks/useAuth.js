import { useState, useEffect, createContext, useContext } from 'react'
import api from '../utils/api'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthProvider() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    setUser(null)
  }

  return { user, loading, login, logout, setUser }
}
