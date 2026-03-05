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

const HeaterControl = ({ readOnly = false }) => {
  const [powerOn, setPowerOn] = useState(false)
  const [level, setLevel] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  
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

  // Connect to WebSocket telemetry (optional - app works without it)
  const { isConnected, lastUpdate } = useHeaterTelemetry(handleTelemetryUpdate)

  const handlePowerChange = async (newPowerState) => {
    if (readOnly) return

    // Mark as user action to prevent telemetry from overriding
    isUserActionRef.current = true
    userActionTimestampRef.current = Date.now()

    setIsLoading(true)
    const result = await sendPowerCommand(newPowerState)

    if (result.success) {
      setPowerOn(newPowerState)
      toast({
        title: newPowerState ? 'Heater turned on' : 'Heater turned off',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // Reset user action flag after a delay
      setTimeout(() => {
        isUserActionRef.current = false
      }, 2000)
    } else {
      toast({
        title: 'Command failed',
        description: result.error || 'Failed to send power command',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      // Revert toggle on error
      setPowerOn(!newPowerState)
      isUserActionRef.current = false
    }
    setIsLoading(false)
  }

  const handleLevelChange = (newLevel) => {
    if (readOnly) return
    setLevel(newLevel)
  }

  const handleLevelChangeEnd = async (newLevel) => {
    if (readOnly) return

    // Mark as user action to prevent telemetry from overriding
    isUserActionRef.current = true
    userActionTimestampRef.current = Date.now()

    setIsLoading(true)
    const result = await sendLevelCommand(newLevel)

    if (result.success) {
      toast({
        title: 'Level updated',
        description: `Heater level set to ${newLevel}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // Reset user action flag after a delay
      setTimeout(() => {
        isUserActionRef.current = false
      }, 2000)
    } else {
      toast({
        title: 'Command failed',
        description: result.error || 'Failed to set heater level',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      // Revert level on error - keep current level
      // (level state is already correct, no need to change)
      isUserActionRef.current = false
    }
    setIsLoading(false)
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
            {isLoading && <Spinner size="sm" color="brand.400" />}
          </HStack>
        </HStack>

        {/* Power Toggle */}
        <PowerToggle
          isOn={powerOn}
          onChange={handlePowerChange}
          isLoading={isLoading}
          readOnly={readOnly}
        />

        {/* Level Slider */}
        <LevelSlider
          level={level}
          onChange={handleLevelChange}
          onChangeEnd={handleLevelChangeEnd}
          isLoading={isLoading}
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
