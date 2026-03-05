import { useEffect, useState, useRef } from 'react'
import { subscribeToChannel, onRealtimeConnectionChange } from '../services/xanoRealtimeSDK'

/**
 * Hook to receive heater telemetry via XANO Realtime
 * Updates heater state from device telemetry
 */
export const useHeaterTelemetry = (onTelemetryUpdate) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const lastTimestampRef = useRef(0)
  const callbackRef = useRef(onTelemetryUpdate)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onTelemetryUpdate
  }, [onTelemetryUpdate])

  // Track WebSocket connection status
  useEffect(() => {
    const unsubscribeConnection = onRealtimeConnectionChange((connected) => {
      setIsConnected(connected)
    })
    return unsubscribeConnection
  }, [])

  useEffect(() => {
    // Try parent channel first (matching your working code pattern)
    // XANO might not support nested channels the same way
    const channelName = 'glacier_live_feed' // Parent channel instead of nested

    // Handle incoming messages from glacier_live_feed channel
    // Message structure: { action: 'event', payload: { data: { device_uid, power_state, level, ... } } }
    const handleMessage = (action) => {
      try {
        // Skip connection_status messages (SDK internal)
        if (action && action.action === 'connection_status') {
          return
        }

        // Only process 'event' actions (actual data messages)
        if (action && action.action !== 'event') {
          return
        }

        console.log('📨 Received message from glacier_live_feed:', action)
        
        // Extract telemetry data from payload.data
        // Structure: action.payload.data = { device_uid, power_state, level, timestamp, ... }
        let telemetry = null
        
        if (action && action.payload && action.payload.data) {
          // Telemetry data is in payload.data as an object
          telemetry = action.payload.data
        } else if (action && action.payload && action.payload.device_uid) {
          // Fallback: telemetry might be directly in payload
          telemetry = action.payload
        }

        if (!telemetry) {
          console.log('No telemetry data found in message:', action)
          return
        }

        // Validate telemetry data
        if (!telemetry.device_uid || typeof telemetry.power_state !== 'number' || typeof telemetry.level !== 'number') {
          console.warn('Invalid telemetry data:', telemetry)
          return
        }

        console.log('✅ Valid heater telemetry received:', telemetry)

        // Only update if timestamp is newer (avoid stale data)
        const timestamp = telemetry.timestamp || Date.now() // Use current time if no timestamp
        if (timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = timestamp
          setLastUpdate(new Date(timestamp))

          // Call callback with telemetry data
          if (callbackRef.current) {
            callbackRef.current({
              powerOn: telemetry.power_state === 1,
              level: telemetry.level,
              timestamp: timestamp,
              deviceUid: telemetry.device_uid,
            })
          }
        }
      } catch (error) {
        console.error('Error processing telemetry message:', error)
      }
    }

    // Handle connection/errors
    const handleError = (error) => {
      console.error('XANO Realtime error:', error)
    }

    // Subscribe to channel
    // Add a small delay to ensure SDK is fully ready (handles React Strict Mode)
    let unsubscribe = null
    const subscribeTimeout = setTimeout(() => {
      try {
        unsubscribe = subscribeToChannel(channelName, handleMessage, handleError)
        console.log('Subscribed to heater telemetry channel:', channelName)
      } catch (error) {
        console.error('Error subscribing to channel:', error)
        handleError(error)
      }
    }, 100) // Small delay to let SDK initialize

    // Cleanup on unmount
    return () => {
      clearTimeout(subscribeTimeout)
      if (unsubscribe) {
        unsubscribe()
      }
    }

  }, []) // Empty dependency array - only run once on mount

  return {
    isConnected,
    lastUpdate,
  }
}
