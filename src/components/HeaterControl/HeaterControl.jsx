import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Text,
  VStack,
  Button,
  useToast,
  Spinner,
  HStack,
} from '@chakra-ui/react'
import PowerToggle from './PowerToggle'
import LevelSlider from './LevelSlider'
import { sendPowerCommand, sendLevelCommand } from '../../services/heaterService'
import { useHeaterTelemetry } from '../../hooks/useHeaterTelemetry'
import { usePendingCommands } from '../../contexts/PendingCommandsContext'

const HeaterControl = ({ readOnly = false }) => {
  const [powerOn, setPowerOn] = useState(false)
  const [level, setLevel] = useState(5)
  const toast = useToast()
  const { addPendingCommand, removePendingCommand, hasPendingCommand, getPendingCommand, pendingCommands } = usePendingCommands()
  
  // Check for pending commands
  const hasPendingPower = hasPendingCommand('POWER')
  const hasPendingLevel = hasPendingCommand('LEVEL')
  const pendingPowerCommand = getPendingCommand('POWER')
  const pendingLevelCommand = getPendingCommand('LEVEL')
  
  // Track when user makes changes to avoid conflicts with telemetry updates
  const userActionTimestampRef = useRef(0)
  const isUserActionRef = useRef(false)

  // Handle telemetry updates from WebSocket
  // Use useCallback to prevent infinite re-renders
  const handleTelemetryUpdate = useCallback((telemetry) => {
    // Only update if telemetry is newer than last user action
    // This prevents telemetry from overriding user's recent changes
    if (telemetry.timestamp > userActionTimestampRef.current) {
      // Small delay to allow user action to complete
      setTimeout(() => {
        if (!isUserActionRef.current) {
          setPowerOn(telemetry.powerOn)
          setLevel(telemetry.level)
        }
        isUserActionRef.current = false
      }, 1000) // 1 second grace period for user actions
    }
  }, [])

  // Handle timeout commands
  useEffect(() => {
    // Check for timeout commands and handle them
    pendingCommands.forEach((command, commandId) => {
      if (command.status === 'timeout') {
        // Command timed out - show error
        toast({
          title: 'Command timeout',
          description: 'Device may not have received the command. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        removePendingCommand(commandId)
        isUserActionRef.current = false
        
        // Revert UI to last known state from telemetry
        // (telemetry will update this automatically)
      }
    })
  }, [pendingCommands, toast, removePendingCommand])

  // Connect to WebSocket telemetry (optional - app works without it)
  const { isConnected, lastUpdate } = useHeaterTelemetry(handleTelemetryUpdate)

  const handlePowerChange = async (newPowerState) => {
    if (readOnly || hasPendingPower) return // Don't allow new commands if one is pending

    // Mark as user action to prevent telemetry from overriding
    isUserActionRef.current = true
    userActionTimestampRef.current = Date.now()

    const result = await sendPowerCommand(newPowerState)

    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'POWER',
        value: newPowerState ? 1 : 0,
      })
      
      // Show pending value (optimistic update)
      setPowerOn(newPowerState)
      
      toast({
        title: 'Command queued',
        description: `Power ${newPowerState ? 'ON' : 'OFF'} - waiting for confirmation...`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Command failed',
        description: result.error || 'Failed to send power command',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      isUserActionRef.current = false
    }
  }

  const handleLevelChange = (newLevel) => {
    if (readOnly || hasPendingLevel) return // Don't allow changes if command is pending
    setLevel(newLevel)
  }

  const handleLevelChangeEnd = async (newLevel) => {
    if (readOnly || hasPendingLevel) return // Don't allow new commands if one is pending

    // Mark as user action to prevent telemetry from overriding
    isUserActionRef.current = true
    userActionTimestampRef.current = Date.now()

    const result = await sendLevelCommand(newLevel)

    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'LEVEL',
        value: newLevel,
      })
      
      // Show pending value (optimistic update)
      setLevel(newLevel)
      
      toast({
        title: 'Command queued',
        description: `Level ${newLevel} - waiting for confirmation...`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Command failed',
        description: result.error || 'Failed to set heater level',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      isUserActionRef.current = false
    }
  }

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      boxShadow="md"
      opacity={readOnly ? 0.9 : 1}
    >
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold" color="white">
            Heater Control
          </Text>
          <HStack spacing={2}>
            {isConnected && (
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg="green.400"
                title="WebSocket connected"
              />
            )}
            {(hasPendingPower || hasPendingLevel) && (
              <Spinner size="sm" color="yellow.400" title="Command pending" />
            )}
          </HStack>
        </HStack>

        {/* Power Toggle */}
        <PowerToggle
          isOn={powerOn}
          onChange={handlePowerChange}
          isPending={hasPendingPower}
          pendingValue={pendingPowerCommand?.value === 1}
          readOnly={readOnly}
        />

        {/* Level Slider */}
        <LevelSlider
          level={level}
          onChange={handleLevelChange}
          onChangeEnd={handleLevelChangeEnd}
          isPending={hasPendingLevel}
          pendingValue={pendingLevelCommand?.value}
          readOnly={readOnly}
        />

        {readOnly && (
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
            Controls are disabled in public view
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export default HeaterControl
