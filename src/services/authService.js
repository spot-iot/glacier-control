import { api } from './api'
import { getDaysUntilExpiration, isJWTExpired } from '../utils/jwt'

/**
 * Authentication Service
 * Handles login, token refresh, and token management
 */

const TOKEN_STORAGE_KEY = 'authToken'
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken'
const USER_STORAGE_KEY = 'user'

/**
 * Store tokens and user data
 */
export const storeAuthData = (accessToken, refreshToken, user) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }
}

/**
 * Get stored tokens
 */
export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem(TOKEN_STORAGE_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
    user: JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null'),
  }
}

/**
 * Clear stored tokens
 */
export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

/**
 * Login - Get access token and refresh token from XANO
 */
export const login = async (email, password) => {
  try {
    // XANO login endpoint
    const response = await api.post('/users/auth/login', {
      email,
      password,
    })

    // XANO response format: { access_token, refresh_token, user }
    const { access_token, refresh_token, user } = response.data
    
    // Store tokens
    storeAuthData(access_token, refresh_token, user)

    return {
      success: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Login failed',
    }
  }
}

/**
 * Refresh tokens - Get new access token and refresh token
 * Uses refresh token rotation - old refresh token is invalidated
 */
export const refreshTokens = async () => {
  try {
    const { refreshToken } = getStoredTokens()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    // Check if refresh token is expired
    if (isJWTExpired(refreshToken)) {
      throw new Error('Refresh token expired')
    }

    // XANO refresh endpoint
    const response = await api.post('/users/auth/refresh', {
      refresh_token: refreshToken,
    })

    // XANO response format: { access_token, refresh_token, user }
    const { access_token, refresh_token, user } = response.data

    // Store new tokens (refresh token rotation)
    storeAuthData(access_token, refresh_token, user)

    return {
      success: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    clearAuthData()
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Token refresh failed',
    }
  }
}

/**
 * Check if refresh token needs renewal (expires in < 7 days)
 */
export const shouldRenewRefreshToken = () => {
  const { refreshToken } = getStoredTokens()
  if (!refreshToken) return false

  const daysRemaining = getDaysUntilExpiration(refreshToken)
  
  // Renew if expires in less than 7 days
  return daysRemaining < 7 && daysRemaining > 0
}

/**
 * Check if access token needs refresh (expires soon)
 * XANO access tokens expire every 30 minutes
 * We'll refresh at 25 minutes (5 minute buffer)
 */
export const shouldRefreshAccessToken = () => {
  const { accessToken } = getStoredTokens()
  if (!accessToken) return false

  // Since XANO manages access token expiration, we'll check via API
  // For now, we'll refresh proactively every 25 minutes
  // This will be handled by the interceptor
  return true
}
