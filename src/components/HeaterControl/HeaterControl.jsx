import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Text,
  VStack,
  useToast,
  HStack,
  IconButton,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import PowerToggle from './PowerToggle'
import LevelSelectModal from './LevelSelectModal'
import { sendPowerCommand, sendLevelCommand } from '../../services/heaterService'
import { useHeaterTelemetry } from '../../hooks/useHeaterTelemetry'
import { usePendingCommands } from '../../contexts/PendingCommandsContext'

// Simple SVG icons for fuel pump, gauge, hourglass, and stopwatch
const FuelPumpIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M6 2h4v4H6zM4 6h8v2H4zM4 8v8h8V8M12 8h2v8h-2M14 10h4v4h-4" />
  </svg>
)

const GaugeIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    <path d="M12 2a10 10 0 0 1 7 7M12 22a10 10 0 0 1-7-7" />
  </svg>
)

const HourglassIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z" />
  </svg>
)

const StopwatchIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l3 3" />
    <path d="M12 5V3M16 2l-1 1M8 2l1 1" />
  </svg>
)

const FlameIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8 6 6 9 6 13c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-2-7-6-11zm0 18c-2.2 0-4-1.8-4-4 0-3.2 1.3-5.5 4-8.5 2.7 3 4 5.3 4 8.5 0 2.2-1.8 4-4 4z" />
  </svg>
)

const HeaterControl = ({ readOnly = false }) => {
  const [powerOn, setPowerOn] = useState(false)
  const [level, setLevel] = useState(5) // Confirmed level from telemetry
  const [runStep, setRunStep] = useState('Unknown')
  const [burnerCoreTemp, setBurnerCoreTemp] = useState(null)
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null)
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0)
  
  // Dummy data states
  const [lifetimeFuel, setLifetimeFuel] = useState(0)
  const [fuelConsumptionRate, setFuelConsumptionRate] = useState(0)
  const [totalRuntime, setTotalRuntime] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [sessionRuntime, setSessionRuntime] = useState(0)
  
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
  const toast = useToast()
  const { addPendingCommand, removePendingCommand, getPendingCommand, pendingCommands } = usePendingCommands()
  
  // Get pending commands for status display
  const pendingPowerCommand = getPendingCommand('POWER')
  const pendingLevelCommand = getPendingCommand('LEVEL')
  const hasPendingCommand = pendingPowerCommand || pendingLevelCommand
  
  // Get command type for status message
  const getPendingCommandType = () => {
    if (pendingPowerCommand) {
      return `POWER ${pendingPowerCommand.value === 1 ? 'ON' : 'OFF'}`
    }
    if (pendingLevelCommand) {
      return `LEVEL ${pendingLevelCommand.value}`
    }
    return null
  }

  // Format session runtime: seconds (0-59), then minutes (0-60), then hrs and minutes
  const formatSessionRuntime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}m`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  // Handle telemetry updates from WebSocket
  const handleTelemetryUpdate = useCallback((telemetry) => {
    // Update UI with latest telemetry (confirmed state)
    const wasPowerOff = !powerOn && telemetry.powerOn
    
    setPowerOn(telemetry.powerOn)
    setLevel(telemetry.level)
    if (telemetry.runStep) {
      setRunStep(telemetry.runStep)
    }
    if (telemetry.burnerCoreTemp !== undefined && telemetry.burnerCoreTemp !== null) {
      setBurnerCoreTemp(telemetry.burnerCoreTemp)
    }
    
    // Update last heartbeat time for "seconds since refresh" calculation
    if (telemetry.timestamp) {
      setLastHeartbeatTime(telemetry.timestamp)
    }
    
    // Start session timer when power turns on
    if (wasPowerOff) {
      setSessionStartTime(Date.now())
    }
    
    // Reset session timer when power turns off
    if (!telemetry.powerOn && sessionStartTime !== null) {
      setSessionStartTime(null)
      setSessionRuntime(0)
    }
  }, [powerOn, sessionStartTime])

  // Update seconds since last refresh
  useEffect(() => {
    if (!lastHeartbeatTime) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      const seconds = Math.floor((now - lastHeartbeatTime) / 1000)
      setSecondsSinceRefresh(seconds)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [lastHeartbeatTime])

  // Update session runtime when power is on
  useEffect(() => {
    if (!sessionStartTime || !powerOn) return
    
    const interval = setInterval(() => {
      const now = Date.now()
      const seconds = Math.floor((now - sessionStartTime) / 1000)
      setSessionRuntime(seconds)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [sessionStartTime, powerOn])

  // Update dummy data periodically
  useEffect(() => {
    // Initialize with random values
    setLifetimeFuel((Math.random() * 500 + 100).toFixed(1))
    setFuelConsumptionRate((Math.random() * 0.5 + 0.1).toFixed(2))
    setTotalRuntime((Math.random() * 1000 + 100).toFixed(1))
    
    // Update dummy data every 10 seconds
    const interval = setInterval(() => {
      setLifetimeFuel((Math.random() * 500 + 100).toFixed(1))
      setFuelConsumptionRate((Math.random() * 0.5 + 0.1).toFixed(2))
      setTotalRuntime((Math.random() * 1000 + 100).toFixed(1))
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // Handle timeout commands
  useEffect(() => {
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
      }
    })
  }, [pendingCommands, toast, removePendingCommand])

  // Connect to WebSocket telemetry
  const { isConnected } = useHeaterTelemetry(handleTelemetryUpdate)

  const handlePowerChange = async (newPowerState) => {
    if (readOnly) return

    const result = await sendPowerCommand(newPowerState)

    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'POWER',
        value: newPowerState ? 1 : 0,
      })
      
      // Start session timer when turning on
      if (newPowerState) {
        setSessionStartTime(Date.now())
      } else {
        setSessionStartTime(null)
        setSessionRuntime(0)
      }
      
      toast({
        title: 'Command sent',
        description: `Power ${newPowerState ? 'ON' : 'OFF'} - waiting for heater confirmation...`,
        status: 'info',
        duration: 3000,
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
    }
  }

  const handleLevelSelect = async (newLevel) => {
    if (readOnly) return

    const result = await sendLevelCommand(newLevel)

    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'LEVEL',
        value: newLevel,
      })
      
      toast({
        title: 'Command sent',
        description: `Level ${newLevel} - waiting for heater confirmation...`,
        status: 'info',
        duration: 3000,
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
          {isConnected && (
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg="green.400"
              title="WebSocket connected"
            />
          )}
        </HStack>

        {/* Power Toggle */}
        <PowerToggle
          isOn={powerOn}
          onChange={handlePowerChange}
          runStep={runStep}
          readOnly={readOnly}
        />

        {/* Level Display with Burner Core Temp */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={3} align="center">
            <Text color="gray.300" fontSize="md" fontWeight="medium" minW="100px">
              Level:
            </Text>
            <Text
              color="brand.400"
              fontSize="lg"
              fontWeight="bold"
              minW="40px"
            >
              {level}
            </Text>
            {!readOnly && (
              <IconButton
                icon={<EditIcon />}
                size="sm"
                variant="ghost"
                colorScheme="brand"
                aria-label="Edit level"
                onClick={() => setIsLevelModalOpen(true)}
              />
            )}
          </HStack>
          {burnerCoreTemp !== null && (
            <HStack spacing={2} align="center">
              <FlameIcon size={18} color="#F6AD55" />
              <Text
                color="orange.400"
                fontSize="md"
                fontWeight="semibold"
              >
                {burnerCoreTemp}°C
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Fuel Row */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <FuelPumpIcon size={18} color="#9F7AEA" />
            <Text color="gray.300" fontSize="sm">
              Lifetime:
            </Text>
            <Text color="purple.400" fontSize="md" fontWeight="semibold">
              {lifetimeFuel} L
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <GaugeIcon size={18} color="#38B2AC" />
            <Text color="gray.300" fontSize="sm">
              Rate:
            </Text>
            <Text color="teal.400" fontSize="md" fontWeight="semibold">
              {fuelConsumptionRate} L/hr
            </Text>
          </HStack>
        </HStack>

        {/* Runtime Row */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <HourglassIcon size={18} color="#4299E1" />
            <Text color="gray.300" fontSize="sm">
              Total Runtime:
            </Text>
            <Text color="blue.400" fontSize="md" fontWeight="semibold">
              {totalRuntime} hrs
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <StopwatchIcon size={18} color="#48BB78" />
            <Text color="gray.300" fontSize="sm">
              Session:
            </Text>
            <Text color="green.400" fontSize="md" fontWeight="semibold">
              {formatSessionRuntime(sessionRuntime)}
            </Text>
          </HStack>
        </HStack>

        {/* Seconds Since Last Refresh */}
        <Box textAlign="center" pt={2}>
          <Text color="gray.500" fontSize="xs">
            {secondsSinceRefresh}s since last refresh
          </Text>
        </Box>

        {/* Command Status Area */}
        {!readOnly && hasPendingCommand && (
          <Box
            bg="gray.700"
            borderRadius="md"
            p={3}
            textAlign="center"
          >
            <Text fontSize="sm" color="yellow.300">
              Waiting for {getPendingCommandType()} command...
            </Text>
          </Box>
        )}

        {readOnly && (
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
            Controls are disabled in public view
          </Text>
        )}

        {/* Level Select Modal */}
        <LevelSelectModal
          isOpen={isLevelModalOpen}
          onClose={() => setIsLevelModalOpen(false)}
          currentLevel={level}
          onSelectLevel={handleLevelSelect}
        />
      </VStack>
    </Box>
  )
}

export default HeaterControl
