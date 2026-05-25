// src/utils/api.js
// Konfigurasi Axios untuk komunikasi dengan backend Laravel

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
})

// Interceptor: Tambah token JWT ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kpi_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: Handle error global (401 = redirect ke login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kpi_token')
      localStorage.removeItem('kpi_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api