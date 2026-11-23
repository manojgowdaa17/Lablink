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
      // Redirect to login if session expired (but not on login page itself)
      const path = window.location.pathname
      if (!path.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
