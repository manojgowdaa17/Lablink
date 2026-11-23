import axios from 'axios'

const api = axios.create({
  // Empty baseURL so all requests go as relative URLs (/api/...)
  // and are handled by Vite's proxy → http://localhost:5000
  // This avoids CORS issues and ensures cookies work correctly.
  baseURL: '',
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
