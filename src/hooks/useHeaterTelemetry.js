import { useEffect, useState, useRef } from 'react'
import { subscribeToChannel, onRealtimeConnectionChange } from '../services/xanoRealtimeSDK'
import { usePendingCommands } from '../contexts/PendingCommandsContext'
import { useToast } from '@chakra-ui/react'

/**
 * Hook to receive heater telemetry via XANO Realtime
 * Handles heartbeat data with embedded command confirmations
 * 
 * Heartbeat format:
 * - Regular: { heater: {...}, climate: {...}, command: null, device_uid, timestamp_utc_ms }
 * - Confirmed: { heater: {...}, climate: {...}, command: { id, status, processed_at_ms }, device_uid, timestamp_utc_ms }
 */
export const useHeaterTelemetry = (onTelemetryUpdate) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const lastTimestampRef = useRef(0)
  const callbackRef = useRef(onTelemetryUpdate)
  const { removePendingCommand, getPendingCommandById, hasPendingCommandId } = usePendingCommands()
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
    const channelName = 'glacier_live_feed'

    // Handle incoming messages from glacier_live_feed channel
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

        console.log('📨 Received heartbeat from glacier_live_feed:', action)
        
        // Extract heartbeat data from payload.data
        const heartbeat = action?.payload?.data
        if (!heartbeat) {
          console.log('No heartbeat data found in message:', action)
          return
        }

        // Validate heartbeat structure
        if (!heartbeat.device_uid || !heartbeat.heater || !heartbeat.timestamp_utc_ms) {
          console.warn('Invalid heartbeat structure:', heartbeat)
          return
        }

        // Check for command confirmation
        if (heartbeat.command && heartbeat.command.id) {
          const commandId = heartbeat.command.id
          const commandStatus = heartbeat.command.status

          console.log(`✅ Command confirmation in heartbeat: ID ${commandId}, Status: ${commandStatus}`)

          // Only process if command is still pending
          if (hasPendingCommandId(commandId)) {
            if (commandStatus === 'EXECUTED') {
              // Command succeeded
              const pendingCommand = getPendingCommandById(commandId)
              const commandType = pendingCommand?.type || 'Command'
              
              removePendingCommand(commandId)
              
              // Special handling for TIMESYNC command
              if (commandType === 'TIMESYNC') {
                toast({
                  title: 'Time synced',
                  description: 'Local time is now synced with UTC time',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                })
              } else {
                toast({
                  title: 'Command confirmed',
                  description: `${commandType} command executed successfully`,
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                })
              }
            } else if (commandStatus === 'FAILED') {
              // Command failed - check for error codes in heater.system
              const errorCode = heartbeat.heater?.system?.error_code
              const errorMessage = errorCode 
                ? `Command failed (Error code: ${errorCode})`
                : 'Command failed - device could not execute command'
              
              removePendingCommand(commandId)
              
              toast({
                title: 'Command failed',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
            }
          } else {
            console.log(`Command ${commandId} confirmation received but not in pending list (already processed or timed out)`)
          }
        }

        // Process telemetry data (always update UI with current state)
        processTelemetry(heartbeat)

      } catch (error) {
        console.error('Error processing heartbeat message:', error)
      }
    }

    // Process telemetry data from heartbeat
    const processTelemetry = (heartbeat) => {
      try {
        // Extract heater state
        const powerState = heartbeat.heater?.system?.power
        const level = heartbeat.heater?.performance?.current_gear
        const runStep = heartbeat.heater?.system?.run_step
        const operatingModeRaw = heartbeat.heater?.system?.operating_mode
        const burnerCoreTemp = heartbeat.heater?.thermals?.burner_core_c
        const heaterAmbientTemp = heartbeat.heater?.thermals?.heater_ambient_c
        const deviceUid = heartbeat.device_uid
        const timestamp = heartbeat.timestamp_utc_ms

        // Convert operating mode to string (handle both string and number)
        let operatingMode = 'LEVEL' // default
        if (operatingModeRaw !== undefined && operatingModeRaw !== null) {
          if (typeof operatingModeRaw === 'string') {
            operatingMode = operatingModeRaw.toUpperCase()
          } else if (typeof operatingModeRaw === 'number') {
            // Map: 0=LEVEL, 1=AUTO, 2=FROST
            const modeMap = { 0: 'LEVEL', 1: 'AUTO', 2: 'FROST' }
            operatingMode = modeMap[operatingModeRaw] || 'LEVEL'
          }
        }

        // Validate required fields
        if (powerState === undefined || level === undefined || !deviceUid || !timestamp) {
          console.warn('Invalid telemetry data in heartbeat:', heartbeat)
          return
        }

        // Convert power state to boolean
        // Handles: "ON"/"OFF" (strings), 1/0 (numbers), "1"/"0" (string numbers)
        let powerOn = false
        if (powerState === 'ON' || powerState === 1 || powerState === '1') {
          powerOn = true
        } else if (powerState === 'OFF' || powerState === 0 || powerState === '0') {
          powerOn = false
        } else {
          console.warn(`Unknown power state value: ${powerState}, defaulting to OFF`)
          powerOn = false
        }

        console.log('✅ Processing heartbeat telemetry:', {
          powerOn,
          level,
          deviceUid,
          timestamp,
          hasCommand: !!heartbeat.command
        })

        // Only update if timestamp is newer (avoid stale data)
        if (timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = timestamp
          setLastUpdate(new Date(timestamp))

          // Call callback with telemetry data
          if (callbackRef.current) {
            callbackRef.current({
              powerOn,
              level,
              runStep: runStep || 'Unknown',
              operatingMode,
              burnerCoreTemp: burnerCoreTemp !== undefined ? burnerCoreTemp : null,
              heaterAmbientTemp: heaterAmbientTemp !== undefined ? heaterAmbientTemp : null,
              timestamp,
              deviceUid,
            })
          }
        }
      } catch (error) {
        console.error('Error processing telemetry from heartbeat:', error)
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

  }, [removePendingCommand, getPendingCommandById, hasPendingCommandId, toast]) // Include dependencies

  return {
    isConnected,
    lastUpdate,
  }
}
