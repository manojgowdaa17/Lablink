import { useState, useCallback } from 'react'
import api from '../utils/api'

export function useEquipment() {
  const [equipment, setEquipment] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const fetchEquipment = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/equipment/', { params })
      setEquipment(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load equipment.')
      setEquipment([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { equipment, total, loading, error, fetchEquipment }
}
