import axios from 'axios'
import { refreshTokens } from './authService'

// XANO API Base URL
// Set VITE_API_BASE_URL in .env file, or it will use the default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        console.log('🔄 Attempting token refresh due to 401 error...')
        const result = await refreshTokens()
        
        if (result.success) {
          console.log('✅ Token refresh successful, retrying original request')
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${result.accessToken}`
          
          // Process queued requests
          processQueue(null, result.accessToken)
          
          // Retry the original request
          return api(originalRequest)
        } else {
          console.error('❌ Token refresh failed:', result.error)
          // Refresh failed - clear tokens and redirect to login
          processQueue(new Error(result.error || 'Token refresh failed'))
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          return Promise.reject(new Error(result.error || 'Token refresh failed'))
        }
      } catch (refreshError) {
        console.error('❌ Token refresh exception:', refreshError)
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError)
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { api }
