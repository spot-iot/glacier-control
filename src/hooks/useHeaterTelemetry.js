import { useEffect, useState, useRef } from 'react'
import { subscribeToChannel, onRealtimeConnectionChange } from '../services/xanoRealtimeSDK'
import { usePendingCommands } from '../contexts/PendingCommandsContext'
import { useToast } from '@chakra-ui/react'

/**
 * Hook to receive heater telemetry via XANO Realtime
 * Updates heater state from device telemetry
 */
export const useHeaterTelemetry = (onTelemetryUpdate) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const lastTimestampRef = useRef(0)
  const callbackRef = useRef(onTelemetryUpdate)
  const { removePendingCommand, getPendingCommand, hasPendingCommandId } = usePendingCommands()
  const toast = useToast()

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
        
        // Extract data from payload.data
        const data = action?.payload?.data
        if (!data) {
          console.log('No data found in message:', action)
          return
        }

        // Check if this is a command confirmation
        if (data.type === 'command_confirmation') {
          console.log('✅ Command confirmation received:', data)
          
          // Handle command confirmation
          if (data.command_id && data.status) {
            // Only process if command is still pending (hasn't timed out)
            if (!hasPendingCommandId(data.command_id)) {
              console.log(`Command ${data.command_id} confirmation received but command is no longer pending (likely timed out)`)
              return // Don't process confirmation for commands that have already timed out
            }
            
            if (data.status === 'success') {
              // Command succeeded - remove from pending
              removePendingCommand(data.command_id)
              console.log(`Command ${data.command_id} confirmed successfully`)
              
              // Show success toast
              const commandType = data.command_type || 'Command'
              toast({
                title: 'Command confirmed',
                description: `${commandType} command executed successfully`,
                status: 'success',
                duration: 2000,
                isClosable: true,
              })
              
            } else if (data.status === 'failed') {
              // Command failed - show error (retry will be handled by user if needed)
              removePendingCommand(data.command_id)
              
              toast({
                title: 'Command failed',
                description: 'Command could not be executed. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
            }
          }

          // If confirmation includes current_state, use it as telemetry update
          if (data.current_state) {
            const telemetry = {
              device_uid: data.device_uid,
              power_state: data.current_state.power_state,
              level: data.current_state.level,
              timestamp: data.timestamp || Date.now(),
            }
            processTelemetry(telemetry)
          }
          return
        }

        // Regular telemetry data
        if (data.device_uid && typeof data.power_state === 'number' && typeof data.level === 'number') {
          processTelemetry(data)
        } else {
          console.log('Invalid telemetry data structure:', data)
        }
      } catch (error) {
        console.error('Error processing telemetry message:', error)
      }
    }

    // Process telemetry data
    const processTelemetry = (telemetry) => {
      // Validate telemetry data
      if (!telemetry.device_uid || typeof telemetry.power_state !== 'number' || typeof telemetry.level !== 'number') {
        console.warn('Invalid telemetry data:', telemetry)
        return
      }

      console.log('✅ Valid heater telemetry received:', telemetry)

      // Check if telemetry matches any pending command (implicit confirmation)
      const pendingPower = getPendingCommand('POWER')
      const pendingLevel = getPendingCommand('LEVEL')
      
      if (pendingPower) {
        const expectedPower = pendingPower.value === 1
        if (telemetry.power_state === (expectedPower ? 1 : 0)) {
          // Telemetry matches pending command - treat as confirmation
          console.log('Telemetry matches pending POWER command - treating as confirmation')
          removePendingCommand(pendingPower.id)
          toast({
            title: 'Command confirmed',
            description: 'Power command executed successfully',
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
        }
      }
      
      if (pendingLevel) {
        if (telemetry.level === pendingLevel.value) {
          // Telemetry matches pending command - treat as confirmation
          console.log('Telemetry matches pending LEVEL command - treating as confirmation')
          removePendingCommand(pendingLevel.id)
          toast({
            title: 'Command confirmed',
            description: `Level ${telemetry.level} confirmed`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
        } else {
          // Telemetry differs from pending - command may have failed
          console.log('Telemetry differs from pending LEVEL command - command may have failed')
          toast({
            title: 'State mismatch',
            description: 'Command may have failed - showing current device state',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
          removePendingCommand(pendingLevel.id)
        }
      }

      // Only update if timestamp is newer (avoid stale data)
      const timestamp = telemetry.timestamp || Date.now()
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
