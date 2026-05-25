import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('kpi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kpi_token')
      localStorage.removeItem('kpi_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api