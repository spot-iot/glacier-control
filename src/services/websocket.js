// WebSocket service for real-time updates from XANO
// XANO has built-in WebSocket support

// Get WebSocket connection details from environment
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'wss://x8ki-letl-twmt.n7.xano.net'
const WS_CONNECTION_HASH = import.meta.env.VITE_WS_CONNECTION_HASH || '04aMV5lTFz_cBcFaEa8SNE7bCyI'

/**
 * Build WebSocket URL for a channel
 * @param {string} channelName - Channel name (e.g., 'glacier_live_feed' or 'glacier_live_feed/heater-telemetry')
 * @returns {string} Full WebSocket URL
 */
export const buildWebSocketURL = (channelName) => {
  // XANO WebSocket URL format options:
  // Option 1: wss://base-url/ws:connection-hash:channel-name
  // Option 2: wss://base-url/ws:connection-hash (then subscribe to channel)
  // Option 3: wss://base-url/ws/channel-name (if connection hash not needed in URL)
  
  // Try Option 1 first (most common)
  // If this doesn't work, we may need to adjust based on XANO's actual format
  return `${WS_BASE_URL}/ws:${WS_CONNECTION_HASH}:${channelName}`
}

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.listeners = new Map()
  }

  connect(url) {
    // Disconnect existing connection if any
    if (this.ws) {
      try {
        this.ws.close()
      } catch (e) {
        // Ignore close errors
      }
      this.ws = null
    }

    try {
      if (!url) {
        console.error('WebSocket URL is required')
        return
      }

      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to:', url)
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit('message', data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected from:', url)
        this.emit('disconnected')
        this.attemptReconnect(url)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.emit('error', error)
    }
  }

  attemptReconnect(url) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
        this.connect(url)
      }, this.reconnectDelay)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data))
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// Create singleton instance
const wsService = new WebSocketService()

// Export service (buildWebSocketURL is already exported above)
export default wsService
