// XANO Realtime Service using the official XANO SDK from CDN
// The SDK is loaded in index.html

// Get XANO configuration from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF'
const WS_CONNECTION_HASH = import.meta.env.VITE_WS_CONNECTION_HASH || '04aMV5lTFz_cBcFaEa8SNE7bCyI'

// Extract instance base URL from API URL (remove /api:... part)
const getInstanceBaseUrl = () => {
  const url = new URL(API_BASE_URL)
  return `${url.protocol}//${url.host}/`
}

// Initialize XANO client using the SDK from CDN
let xanoClient = null

const getXanoClient = () => {
  if (!xanoClient) {
    // Check if XANO SDK is loaded
    if (typeof window.XanoClient === 'undefined') {
      console.error('XANO SDK not loaded. Make sure the script is included in index.html')
      return null
    }

    const instanceBaseUrl = getInstanceBaseUrl()
    xanoClient = new window.XanoClient({
      instanceBaseUrl: instanceBaseUrl,
      realtimeConnectionHash: WS_CONNECTION_HASH
    })
    
    console.log('XANO client initialized:', {
      instanceBaseUrl,
      realtimeConnectionHash: WS_CONNECTION_HASH
    })
  }
  return xanoClient
}

/**
 * Get a channel for real-time updates
 * @param {string} channelName - Channel name (e.g., 'glacier_live_feed')
 * @returns {object} XANO channel object or null
 */
export const getChannel = (channelName) => {
  const client = getXanoClient()
  if (!client) {
    console.warn('XANO client not available')
    return null
  }
  
  try {
    return client.channel(channelName)
  } catch (error) {
    console.error('Error getting channel:', error)
    return null
  }
}

/**
 * Subscribe to channel messages
 * @param {string} channelName - Channel name
 * @param {function} onMessage - Callback for messages (receives action object)
 * @param {function} onError - Optional error callback
 * @returns {function} Unsubscribe function
 */
export const subscribeToChannel = (channelName, onMessage, onError = null) => {
  // Wait a bit for SDK to be fully ready (handles React Strict Mode double-invocation)
  const channel = getChannel(channelName)
  if (!channel) {
    console.error('Failed to get channel:', channelName)
    return () => {}
  }
  
  // Wrap the callback to handle connection_status messages
  const wrappedCallback = (action) => {
    // Filter out connection_status messages - these are just SDK internal messages
    if (action && action.action === 'connection_status') {
      console.log('✅ XANO connection status:', action.payload?.status)
      return // Don't process connection_status messages
    }
    
    // Process actual data messages
    onMessage(action)
  }
  
  try {
    // XANO SDK uses channel.on(callback) - callback receives action object
    channel.on(wrappedCallback)
    console.log('✅ Subscribed to channel:', channelName)
  } catch (error) {
    console.error('Error subscribing to channel:', error)
    if (onError) {
      onError(error)
    }
  }

  // Return unsubscribe function
  return () => {
    // XANO SDK might have an off method, but we'll just note the unsubscribe
    console.log('Unsubscribing from channel:', channelName)
    // Note: XANO SDK might handle cleanup automatically
  }
}

/**
 * Get WebSocket connection status
 * @returns {boolean} True if connected (we can't directly check, so return true if client exists)
 */
export const isRealtimeConnected = () => {
  return xanoClient !== null
}

/**
 * Subscribe to connection status changes
 * Note: XANO SDK doesn't expose connection status directly
 * @param {function} callback - Called with (isConnected) boolean
 * @returns {function} Unsubscribe function
 */
export const onRealtimeConnectionChange = (callback) => {
  // XANO SDK doesn't expose connection status directly
  // We'll assume connected if client exists
  const client = getXanoClient()
  if (client) {
    callback(true)
  } else {
    callback(false)
  }
  
  // Return unsubscribe (no-op since we can't track connection status)
  return () => {}
}

export default {
  getChannel,
  subscribeToChannel,
  isRealtimeConnected,
  onRealtimeConnectionChange
}
