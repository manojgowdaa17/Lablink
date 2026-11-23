import { useState } from 'react'
import api from '../utils/api'

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary]                 = useState('')
  const [prerequisites, setPrerequisites]     = useState([])
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState(null)
  const [aiAvailable, setAiAvailable]         = useState(true)

  const getRecommendations = async (projectTitle, projectDescription) => {
    setLoading(true)
    setError(null)
    setRecommendations([])
    setSummary('')
    setPrerequisites([])
    try {
      const res = await api.post('/api/ai/recommend', {
        project_title: projectTitle,
        project_description: projectDescription,
      })
      setRecommendations(res.data.recommendations || [])
      setSummary(res.data.summary || '')
      setPrerequisites(res.data.prerequisites || [])
      setAiAvailable(res.data.ai_available !== false)
    } catch (err) {
      setError(err.response?.data?.error || 'AI recommendation failed.')
      setAiAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  return {
    recommendations, summary, prerequisites,
    loading, error, aiAvailable,
    getRecommendations,
  }
}

export function useFairScore() {
  const [score, setScore]             = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const getScore = async (projectId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/api/ai/score', { project_id: projectId })
      setScore(res.data.score)
      setExplanation(res.data.explanation || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Score computation failed.')
    } finally {
      setLoading(false)
    }
  }

  return { score, explanation, loading, error, getScore }
}
