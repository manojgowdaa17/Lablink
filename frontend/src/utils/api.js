import axios from 'axios'

// In development: baseURL is '' so Vite proxy handles /api/... → localhost:5000
// In production:  VITE_API_URL is injected by Render (e.g. https://lablink-backend.onrender.com)
const baseURL = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : ''

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname
      // Don't redirect if already on a login page
      if (!path.includes('/login')) {
        // Faculty paths redirect to faculty login; everyone else to student login
        if (path.startsWith('/faculty/')) {
          window.location.href = '/faculty/login'
        } else {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
