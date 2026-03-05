// XANO Realtime Client Implementation
// Based on XANO's JavaScript SDK pattern
// Implements the same interface as @xano/js-sdk but using native WebSocket

// Get XANO configuration from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF'
const WS_CONNECTION_HASH = import.meta.env.VITE_WS_CONNECTION_HASH || '04aMV5lTFz_cBcFaEa8SNE7bCyI'

// Extract instance base URL from API URL (remove /api:... part)
const getInstanceBaseUrl = () => {
  const url = new URL(API_BASE_URL)
  return `${url.protocol}//${url.host}/`
}

/**
 * XANO Realtime Channel
 * Mimics the @xano/js-sdk channel API
 * 
 * Usage:
 * channel.on((message) => {
 *   switch (message.action) {
 *     case 'message':
 *       handleMessage(message.payload);
 *       break;
 *   }
 * });
 */
class XanoChannel {
  constructor(client, channelName) {
    this.client = client
    this.channelName = channelName
    this.listeners = []
    this.isSubscribed = false
  }

  // XANO SDK uses channel.on(callback) not channel.on('message', callback)
  on(callback) {
    this.listeners.push(callback)

    // Auto-subscribe when listener is added
    if (!this.isSubscribed) {
      this.subscribe()
    }
  }

  off(callback) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  subscribe() {
    if (this.isSubscribed) {
      console.log('Channel already subscribed:', this.channelName)
      return
    }
    this.isSubscribed = true
    console.log('Subscribing channel:', this.channelName)
    this.client.subscribeToChannel(this.channelName, this)
  }

  unsubscribe() {
    this.isSubscribed = false
    this.client.unsubscribeFromChannel(this.channelName)
  }

  send(data) {
    this.client.sendToChannel(this.channelName, data)
  }

  emit(message) {
    // XANO SDK messages have action and payload structure
    // Call all listeners with the message
    this.listeners.forEach((callback) => {
      try {
        callback(message)
      } catch (error) {
        console.error('Error in channel listener:', error)
      }
    })
  }
}

/**
 * XANO Realtime Client
 * Mimics the @xano.io/client API
 */
class XanoRealtimeClient {
  constructor(baseUrl, connectionHash) {
    this.baseUrl = baseUrl
    this.connectionHash = connectionHash
    this.ws = null
    this.channels = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isConnecting = false
    this.isConnected = false
    this.connectionListeners = []
  }

  onConnectionChange(callback) {
    this.connectionListeners.push(callback)
    // Immediately call with current state
    callback(this.isConnected)
  }

  offConnectionChange(callback) {
    const index = this.connectionListeners.indexOf(callback)
    if (index > -1) {
      this.connectionListeners.splice(index, 1)
    }
  }

  emitConnectionChange(connected) {
    this.isConnected = connected
    this.connectionListeners.forEach(callback => callback(connected))
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.emitConnectionChange(false)

    // Build WebSocket URL
    // XANO WebSocket URL format (from your working code):
    // wss://instance.xano.io/rt/connection-hash
    // Example: wss://x3ab-tpfd-lqgo.n7e.xano.io/rt/DZNPRyrgZXSvXLMxT0-fzBLIwu4
    
    // Convert http:// to ws:// and https:// to wss://
    let baseUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    
    // Remove trailing slash if present (we'll add /rt/ after)
    baseUrl = baseUrl.replace(/\/$/, '')
    
    // XANO WebSocket URL format: wss://instance.xano.io/rt/connection-hash
    const wsUrl = `${baseUrl}/rt/${this.connectionHash}`
    
    // Only log on first attempt to reduce console noise
    if (this.reconnectAttempts === 0) {
      console.log('Attempting to connect to XANO Realtime:', wsUrl)
    }

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ XANO Realtime connected:', wsUrl)
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emitConnectionChange(true)

        // XANO SDK handles subscription automatically when channel.on() is called
        // No need to send explicit subscription messages
        // The channels are already subscribed via their .on() calls
        console.log('Connection established. Channels will receive messages automatically.')
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Received WebSocket message:', message)
          this.handleMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data)
          // Try to handle as plain text if JSON parsing fails
          console.log('Raw message data:', event.data)
        }
      }

      this.ws.onerror = (error) => {
        // Only log error on first attempt to reduce console noise
        if (this.reconnectAttempts === 0) {
          console.error('XANO Realtime WebSocket error:', error)
          console.error('URL format might be incorrect. Please check XANO documentation for the correct WebSocket URL format.')
        }
        this.isConnecting = false
      }

      this.ws.onclose = (event) => {
        // Log all disconnections to help debug
        console.log('🔌 XANO Realtime disconnected. Code:', event.code, 'Reason:', event.reason || 'No reason provided')
        console.log('WebSocket state before close:', this.ws?.readyState)
        
        this.isConnecting = false
        this.emitConnectionChange(false)
        this.ws = null

        // Attempt reconnect (but reduce noise after first few attempts)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          // Only log every 3rd attempt to reduce console noise
          if (this.reconnectAttempts % 3 === 1 || this.reconnectAttempts <= 2) {
            console.log(`🔄 Reconnecting to XANO Realtime (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          }
          setTimeout(() => {
            this.connect()
          }, this.reconnectDelay)
        } else {
          console.error('❌ Max reconnection attempts reached. WebSocket connection failed.')
          console.error('Current URL:', wsUrl)
        }
      }
    } catch (error) {
      console.error('XANO Realtime connection error:', error)
      this.isConnecting = false
    }
  }

  handleMessage(rawMessage) {
    // XANO SDK message format based on your working code:
    // The callback receives: { action: 'message', payload: { data: [...] } }
    // Or the action directly with payload structure
    
    try {
      const message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
      console.log('🔍 Processing message:', message)
      
      // Extract channel name from message or use first subscribed channel
      const channelName = message.channel || this.getChannelFromMessage(message)
      console.log('📍 Channel name:', channelName, 'Available channels:', Array.from(this.channels.keys()))
      
      const channel = this.channels.get(channelName)

      if (channel) {
        console.log('✅ Routing message to channel:', channelName)
        // Emit the action/message directly to channel listeners
        // Your working code shows: channel.on(function(action) { ... })
        // So we pass the message/action directly
        channel.emit(message)
      } else {
        // If no channel found, try to route to first subscribed channel
        // (XANO might send messages without explicit channel in some cases)
        if (this.channels.size === 1) {
          const firstChannel = Array.from(this.channels.values())[0]
          const firstChannelName = Array.from(this.channels.keys())[0]
          console.log('⚠️ No matching channel, routing to first subscribed channel:', firstChannelName)
          firstChannel.emit(message)
        } else {
          console.warn('❌ Received message for unknown channel:', channelName, message)
          console.warn('Available channels:', Array.from(this.channels.keys()))
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, rawMessage)
    }
  }

  getChannelFromMessage(message) {
    // Try to infer channel from message structure
    // This might need adjustment based on actual XANO message format
    if (message.channel) {
      return message.channel
    }
    // Default to first subscribed channel if only one
    if (this.channels.size === 1) {
      return Array.from(this.channels.keys())[0]
    }
    return null
  }

  subscribeToChannel(channelName, channel) {
    // XANO SDK might handle subscription automatically when channel.on() is called
    // Don't send explicit subscription messages - they might be causing the disconnect
    // Just ensure the connection is open
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Connect first if not connected
      this.connect()
      // The subscription will happen automatically when connection opens
      return
    }

    // XANO SDK likely handles subscriptions automatically
    // Don't send explicit subscription messages - they're causing disconnects
    console.log('Channel subscription handled automatically by XANO SDK:', channelName)
  }

  sendSubscription(channelName) {
    // Send subscription message to XANO
    // Note: XANO SDK might handle subscription automatically when channel.on() is called
    // But we'll try explicit subscription in case it's needed
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot subscribe - WebSocket not connected')
      return
    }

    // Track subscriptions to avoid duplicates
    if (!this.subscribedChannels) {
      this.subscribedChannels = new Set()
    }
    
    if (this.subscribedChannels.has(channelName)) {
      console.log('Already subscribed to channel:', channelName)
      return
    }

    try {
      // Try subscription format - XANO might use different formats
      // Based on your working code, the SDK might handle this automatically
      // But we'll try explicit subscription
      const subscribeMessage = {
        action: 'subscribe',
        channel: channelName
      }
      console.log('📤 Sending subscription:', subscribeMessage)
      this.ws.send(JSON.stringify(subscribeMessage))
      this.subscribedChannels.add(channelName)
    } catch (error) {
      console.error('Error sending subscription:', error)
    }
  }

  unsubscribeFromChannel(channelName) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        channel: channelName
      }
      this.ws.send(JSON.stringify(message))
    }
  }

  sendToChannel(channelName, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        channel: channelName,
        data: data
      }
      this.ws.send(JSON.stringify(message))
    }
  }

  channel(channelName) {
    if (!this.channels.has(channelName)) {
      const channel = new XanoChannel(this, channelName)
      this.channels.set(channelName, channel)
    }
    return this.channels.get(channelName)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.emitConnectionChange(false)
    this.channels.clear()
  }
}

/**
 * XANO Client (main entry point)
 * Mimics @xano/js-sdk API
 * 
 * Usage:
 * const client = new XanoClient({
 *   instanceBaseUrl: "https://instance.xano.io/",
 *   realtimeCanonical: "connection-hash"
 * });
 * 
 * const channel = client.channel("channel-name");
 * channel.on((message) => { ... });
 */
class XanoClient {
  constructor(config) {
    this.instanceBaseUrl = config.instanceBaseUrl || config.baseUrl
    // Your working code uses realtimeConnectionHash, not realtimeCanonical
    this.realtimeConnectionHash = config.realtimeConnectionHash || config.realtimeCanonical
    this.realtime = new XanoRealtimeClient(this.instanceBaseUrl, this.realtimeConnectionHash)
  }

  // XANO SDK uses client.channel() not client.realtime.channel()
  channel(channelName) {
    return this.realtime.channel(channelName)
  }
}

// Create singleton instance
const instanceBaseUrl = getInstanceBaseUrl()
const xanoClient = new XanoClient({
  instanceBaseUrl: instanceBaseUrl,
  realtimeConnectionHash: WS_CONNECTION_HASH
})

// Auto-connect when first channel is accessed
let autoConnectDone = false
const originalChannel = xanoClient.realtime.channel.bind(xanoClient.realtime)
xanoClient.realtime.channel = function(channelName) {
  if (!autoConnectDone) {
    autoConnectDone = true
    this.connect()
  }
  return originalChannel(channelName)
}

/**
 * Get a channel for real-time updates
 * @param {string} channelName - Channel name (e.g., 'glacier_live_feed/heater_telemetry')
 * @returns {object} XANO channel object
 */
export const getChannel = (channelName) => {
  // XANO SDK uses client.channel() not client.realtime.channel()
  return xanoClient.channel(channelName)
}

/**
 * Subscribe to channel messages
 * @param {string} channelName - Channel name
 * @param {function} onMessage - Callback for messages
 * @param {function} onError - Optional error callback
 * @returns {function} Unsubscribe function
 */
export const subscribeToChannel = (channelName, onMessage, onError = null) => {
  const channel = getChannel(channelName)
  
  // XANO SDK uses channel.on(callback) not channel.on('message', callback)
  // The callback receives messages with { action, payload } structure
  channel.on(onMessage)

  // Note: XANO SDK doesn't have separate error events in the same way
  // Errors are typically handled at the WebSocket level

  // Return unsubscribe function
  return () => {
    channel.off(onMessage)
    channel.unsubscribe()
  }
}

/**
 * Get WebSocket connection status
 * @returns {boolean} True if connected
 */
export const isRealtimeConnected = () => {
  return xanoClient.realtime.isConnected
}

/**
 * Subscribe to connection status changes
 * @param {function} callback - Called with (isConnected) boolean
 * @returns {function} Unsubscribe function
 */
export const onRealtimeConnectionChange = (callback) => {
  xanoClient.realtime.onConnectionChange(callback)
  return () => {
    xanoClient.realtime.offConnectionChange(callback)
  }
}

export default xanoClient
