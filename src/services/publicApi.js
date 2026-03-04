import axios from 'axios'

// Public API client - READ ONLY endpoints only
// This ensures no write operations can be performed from public view
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-xano-instance.xano.app/api/v1'

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // No auth token for public API - uses read-only endpoints
})

// Public API methods - READ ONLY
// These should only call GET endpoints that don't modify state

export const publicApiMethods = {
  // Weather data (read-only)
  getWeather: () => publicApi.get('/weather/current'),
  getForecast: () => publicApi.get('/weather/forecast'),

  // Heater status (read-only)
  getHeaterStatus: () => publicApi.get('/heater/status'),
  getHeaterSetpoint: () => publicApi.get('/heater/setpoint'),
  // Note: No POST/PUT/DELETE methods for heater control

  // Temperature data (read-only)
  getCurrentTemperature: () => publicApi.get('/temperature/current'),
  getTemperatureHistory: (params) => publicApi.get('/temperature/history', { params }),
  // Note: No write operations for temperature

  // General read-only data
  getSystemStatus: () => publicApi.get('/system/status'),
}

// WebSocket for public view - read-only updates only
// This should connect to a read-only WebSocket endpoint if available
export const createPublicWebSocket = (url) => {
  // TODO: When XANO WebSocket is ready, create read-only connection
  // This should only subscribe to data updates, not command channels
  return new WebSocket(url)
}

export default publicApi
