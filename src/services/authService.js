import axios from 'axios'
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
 * 
 * IMPORTANT: Login should not use the api instance (which adds Authorization header)
 * Use axios directly since login doesn't require authentication
 */
export const login = async (email, password) => {
  try {
    // Use axios directly (not api instance) to avoid adding Authorization header
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF'
    
    console.log('🔐 Attempting login to:', `${API_BASE_URL}/users/auth/login`)
    
    const response = await axios.post(
      `${API_BASE_URL}/users/auth/login`,
      {
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't add Authorization header - login endpoint doesn't require auth
      }
    )

    console.log('✅ Login successful, response:', response.data)

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
    console.error('❌ Login error:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed',
    }
  }
}

/**
 * Refresh tokens - Get new access token and refresh token
 * Uses refresh token rotation - old refresh token is invalidated
 * 
 * IMPORTANT: This must use axios directly (not the api instance) to avoid
 * adding the expired Authorization header
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

    // Use axios directly (not api instance) to avoid adding expired Authorization header
    // The refresh endpoint should not require authentication
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF'
    
    const response = await axios.post(
      `${API_BASE_URL}/users/auth/refresh`,
      {
        refresh_token: refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't add Authorization header - refresh endpoint uses refresh_token in body
      }
    )

    // XANO response format: { access_token, refresh_token, user }
    const { access_token, refresh_token, user } = response.data

    // Store new tokens (refresh token rotation)
    storeAuthData(access_token, refresh_token, user)

    console.log('✅ Token refresh successful')

    return {
      success: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    console.error('Error response:', error.response?.data)
    clearAuthData()
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Token refresh failed',
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
