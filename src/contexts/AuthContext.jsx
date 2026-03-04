import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as authLogin, getStoredTokens, clearAuthData, refreshTokens, shouldRenewRefreshToken } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const refreshIntervalRef = useRef(null)
  const refreshTokenCheckIntervalRef = useRef(null)

  // Check for existing session on mount
  useEffect(() => {
    const { accessToken, refreshToken, user: storedUser } = getStoredTokens()
    
    if (accessToken && refreshToken) {
      setUser(storedUser)
      setIsAuthenticated(true)
      
      // Start auto-refresh intervals
      startAutoRefresh()
    }
    
    setIsLoading(false)
  }, [])

  // Auto-refresh access token every 25 minutes (5 min buffer before 30 min expiry)
  const startAutoRefresh = () => {
    // Clear any existing intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    if (refreshTokenCheckIntervalRef.current) {
      clearInterval(refreshTokenCheckIntervalRef.current)
    }

    // Refresh access token every 25 minutes (1,500,000 ms)
    refreshIntervalRef.current = setInterval(async () => {
      const { refreshToken } = getStoredTokens()
      if (refreshToken) {
        try {
          const result = await refreshTokens()
          if (result.success) {
            setUser(result.user)
            setIsAuthenticated(true)
            console.log('Access token refreshed automatically')
          } else {
            // Refresh failed - logout
            handleLogout()
          }
        } catch (error) {
          console.error('Auto-refresh error:', error)
          handleLogout()
        }
      } else {
        handleLogout()
      }
    }, 25 * 60 * 1000) // 25 minutes

    // Check refresh token expiration daily (renew if < 7 days remaining)
    refreshTokenCheckIntervalRef.current = setInterval(async () => {
      const { refreshToken } = getStoredTokens()
      if (refreshToken && shouldRenewRefreshToken()) {
        try {
          const result = await refreshTokens()
          if (result.success) {
            setUser(result.user)
            setIsAuthenticated(true)
            console.log('Refresh token renewed proactively')
          } else {
            handleLogout()
          }
        } catch (error) {
          console.error('Refresh token renewal error:', error)
          handleLogout()
        }
      }
    }, 24 * 60 * 60 * 1000) // 24 hours
  }

  // Stop auto-refresh on logout
  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
    if (refreshTokenCheckIntervalRef.current) {
      clearInterval(refreshTokenCheckIntervalRef.current)
      refreshTokenCheckIntervalRef.current = null
    }
  }

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const result = await authLogin(email, password)
      
      if (result.success) {
        setUser(result.user)
        setIsAuthenticated(true)
        startAutoRefresh()
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    stopAutoRefresh()
    clearAuthData()
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  const logout = () => {
    handleLogout()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
