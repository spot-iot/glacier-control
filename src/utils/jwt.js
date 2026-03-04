/**
 * JWT Utility Functions
 * Decodes JWT tokens to read expiration and other claims
 */

/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the signature - only decodes the payload
 * For security, always verify tokens server-side
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null

    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    return decoded
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

/**
 * Get expiration timestamp from JWT
 * Returns expiration time in milliseconds (Unix timestamp)
 */
export const getJWTExpiration = (token) => {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return null
  
  // JWT exp is in seconds, convert to milliseconds
  return decoded.exp * 1000
}

/**
 * Check if JWT token is expired
 * Returns true if token is expired or will expire soon
 */
export const isJWTExpired = (token, bufferSeconds = 0) => {
  const expiration = getJWTExpiration(token)
  if (!expiration) return true
  
  const now = Date.now()
  const buffer = bufferSeconds * 1000
  
  return now >= (expiration - buffer)
}

/**
 * Get days until JWT expiration
 * Returns number of days remaining (can be negative if expired)
 */
export const getDaysUntilExpiration = (token) => {
  const expiration = getJWTExpiration(token)
  if (!expiration) return 0
  
  const now = Date.now()
  const diffMs = expiration - now
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  return Math.floor(diffDays)
}

/**
 * Get seconds until JWT expiration
 * Returns number of seconds remaining (can be negative if expired)
 */
export const getSecondsUntilExpiration = (token) => {
  const expiration = getJWTExpiration(token)
  if (!expiration) return 0
  
  const now = Date.now()
  const diffMs = expiration - now
  
  return Math.floor(diffMs / 1000)
}
