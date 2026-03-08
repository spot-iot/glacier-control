import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Text,
  VStack,
  useToast,
  HStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  useDisclosure,
  ButtonGroup,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { 
  Fire, 
  GasPump, 
  Gauge, 
  Hourglass, 
  Timer,
  Gear,
  Lightning,
  BatteryCharging,
  WaveSine,
  DropHalf,
  ArrowsLeftRight
} from 'phosphor-react'
import FanIcon from '../Icons/FanIcon'
import GasCanIcon from '../Icons/GasCanIcon'
import PowerToggle from './PowerToggle'
import LevelSelectModal from './LevelSelectModal'
import { sendPowerCommand, sendLevelCommand, sendTimeSyncCommand, sendModeCommand } from '../../services/heaterService'
import { useHeaterTelemetry } from '../../hooks/useHeaterTelemetry'
import { usePendingCommands } from '../../contexts/PendingCommandsContext'

const HeaterControl = ({ readOnly = false }) => {
  const [powerOn, setPowerOn] = useState(false)
  const [level, setLevel] = useState(5) // Confirmed level from telemetry
  const [operatingMode, setOperatingMode] = useState('LEVEL') // LEVEL, AUTO, FROST
  const [runStep, setRunStep] = useState('Unknown')
  const [burnerCoreTemp, setBurnerCoreTemp] = useState(null)
  const [heaterAmbientTemp, setHeaterAmbientTemp] = useState(null)
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null)
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0)
  
  // Dummy data states
  const [lifetimeFuel, setLifetimeFuel] = useState(0)
  const [fuelConsumptionRate, setFuelConsumptionRate] = useState(0)
  const [fuelGauge, setFuelGauge] = useState(0)
  const [hoursTillEmpty, setHoursTillEmpty] = useState(0)
  const [totalRuntime, setTotalRuntime] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [sessionRuntime, setSessionRuntime] = useState(0)
  const [voltage, setVoltage] = useState(0)
  const [current, setCurrent] = useState(0)
  const [fanSpeed, setFanSpeed] = useState(0)
  const [pumpHz, setPumpHz] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
  const { isOpen: isTimeSyncModalOpen, onOpen: onTimeSyncModalOpen, onClose: onTimeSyncModalClose } = useDisclosure()
  const toast = useToast()
  const { addPendingCommand, removePendingCommand, getPendingCommand, pendingCommands } = usePendingCommands()
  
  // Get pending commands for status display
  const pendingPowerCommand = getPendingCommand('POWER')
  const pendingLevelCommand = getPendingCommand('LEVEL')
  const pendingModeCommand = getPendingCommand('MODE')
  const hasPendingCommand = pendingPowerCommand || pendingLevelCommand || pendingModeCommand

  // Get pending mode value (if any)
  const pendingModeValue = pendingModeCommand?.value
  const pendingModeName = pendingModeValue !== undefined 
    ? { 0: 'LEVEL', 1: 'AUTO', 2: 'FROST' }[pendingModeValue]
    : null
  
  // Get command type for status message
  const getPendingCommandType = () => {
    if (pendingPowerCommand) {
      return `POWER ${pendingPowerCommand.value === 1 ? 'ON' : 'OFF'}`
    }
    if (pendingLevelCommand) {
      return `LEVEL ${pendingLevelCommand.value}`
    }
    if (pendingModeCommand) {
      const modeNames = { 0: 'LEVEL', 1: 'AUTO', 2: 'FROST' }
      return `MODE ${modeNames[pendingModeCommand.value] || pendingModeCommand.value}`
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
    if (telemetry.heaterAmbientTemp !== undefined && telemetry.heaterAmbientTemp !== null) {
      setHeaterAmbientTemp(telemetry.heaterAmbientTemp)
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

  // Update current time (UTC)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const utcTime = now.toUTCString().split(' ')[4] // Get HH:MM:SS from UTC string
      setCurrentTime(utcTime)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

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
    setFuelGauge((Math.random() * 50 + 20).toFixed(1)) // 20-70 L or %
    setHoursTillEmpty((Math.random() * 100 + 10).toFixed(1)) // 10-110 hrs
    setTotalRuntime((Math.random() * 1000 + 100).toFixed(1))
    setVoltage((Math.random() * 5 + 10).toFixed(1)) // 10-15V
    setCurrent((Math.random() * 2 + 0.5).toFixed(2)) // 0.5-2.5A
    setFanSpeed(Math.floor(Math.random() * 2000 + 1000)) // 1000-3000 RPM
    setPumpHz((Math.random() * 20 + 10).toFixed(1)) // 10-30 Hz
    
    // Update dummy data every 10 seconds
    const interval = setInterval(() => {
      setLifetimeFuel((Math.random() * 500 + 100).toFixed(1))
      setFuelConsumptionRate((Math.random() * 0.5 + 0.1).toFixed(2))
      setFuelGauge((Math.random() * 50 + 20).toFixed(1))
      setHoursTillEmpty((Math.random() * 100 + 10).toFixed(1))
      setTotalRuntime((Math.random() * 1000 + 100).toFixed(1))
      setVoltage((Math.random() * 5 + 10).toFixed(1))
      setCurrent((Math.random() * 2 + 0.5).toFixed(2))
      setFanSpeed(Math.floor(Math.random() * 2000 + 1000))
      setPumpHz((Math.random() * 20 + 10).toFixed(1))
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

  const handleTimeSync = async () => {
    onTimeSyncModalClose()
    
    const result = await sendTimeSyncCommand()
    
    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'TIMESYNC',
        value: 1,
      })
      
      toast({
        title: 'Time sync command sent',
        description: 'Waiting for heater confirmation...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Sync failed',
        description: result.error || 'Failed to send time sync command',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleModeChange = async (newMode) => {
    if (readOnly) return
    if (newMode === operatingMode) return // No change needed

    // Map mode to command value: LEVEL=0, AUTO=1, FROST=2
    const modeValues = { 'LEVEL': 0, 'AUTO': 1, 'FROST': 2 }
    const commandValue = modeValues[newMode]

    const result = await sendModeCommand(commandValue)
    
    if (result.success && result.commandId) {
      // Add to pending commands
      addPendingCommand(result.commandId, {
        type: 'MODE',
        value: commandValue,
      })
      
      toast({
        title: 'Mode command sent',
        description: `Setting mode to ${newMode} - waiting for heater confirmation...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Command failed',
        description: result.error || 'Failed to send mode command',
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

        {/* Current Time (UTC) with Sync Button */}
        {!readOnly && (
          <HStack spacing={2} align="center" justify="center">
            <Text color="gray.300" fontSize="sm" fontWeight="medium">
              {currentTime} UTC
            </Text>
            <IconButton
              icon={<ArrowsLeftRight size={16} />}
              size="xs"
              variant="ghost"
              colorScheme="brand"
              aria-label="Sync time"
              onClick={onTimeSyncModalOpen}
            />
          </HStack>
        )}

        {/* Operating Mode Selector */}
        <ButtonGroup isAttached variant="outline" size="sm" w="100%">
          <Button
            flex={1}
            onClick={() => handleModeChange('LEVEL')}
            isDisabled={readOnly}
            colorScheme={operatingMode === 'LEVEL' && !pendingModeCommand ? 'brand' : 'gray'}
            bg={
              operatingMode === 'LEVEL' && !pendingModeCommand 
                ? 'brand.400' 
                : pendingModeName === 'LEVEL' 
                  ? 'gray.600' 
                  : 'transparent'
            }
            color={
              operatingMode === 'LEVEL' && !pendingModeCommand 
                ? 'white' 
                : pendingModeName === 'LEVEL' 
                  ? 'gray.200' 
                  : 'gray.300'
            }
            _hover={{
              bg: operatingMode === 'LEVEL' && !pendingModeCommand ? 'brand.500' : 'gray.700',
            }}
          >
            Level
          </Button>
          <Button
            flex={1}
            onClick={() => handleModeChange('AUTO')}
            isDisabled={readOnly}
            colorScheme={operatingMode === 'AUTO' && !pendingModeCommand ? 'brand' : 'gray'}
            bg={
              operatingMode === 'AUTO' && !pendingModeCommand 
                ? 'brand.400' 
                : pendingModeName === 'AUTO' 
                  ? 'gray.600' 
                  : 'transparent'
            }
            color={
              operatingMode === 'AUTO' && !pendingModeCommand 
                ? 'white' 
                : pendingModeName === 'AUTO' 
                  ? 'gray.200' 
                  : 'gray.300'
            }
            _hover={{
              bg: operatingMode === 'AUTO' && !pendingModeCommand ? 'brand.500' : 'gray.700',
            }}
          >
            Auto
          </Button>
          <Button
            flex={1}
            onClick={() => handleModeChange('FROST')}
            isDisabled={readOnly}
            colorScheme={operatingMode === 'FROST' && !pendingModeCommand ? 'brand' : 'gray'}
            bg={
              operatingMode === 'FROST' && !pendingModeCommand 
                ? 'brand.400' 
                : pendingModeName === 'FROST' 
                  ? 'gray.600' 
                  : 'transparent'
            }
            color={
              operatingMode === 'FROST' && !pendingModeCommand 
                ? 'white' 
                : pendingModeName === 'FROST' 
                  ? 'gray.200' 
                  : 'gray.300'
            }
            _hover={{
              bg: operatingMode === 'FROST' && !pendingModeCommand ? 'brand.500' : 'gray.700',
            }}
          >
            Frost
          </Button>
        </ButtonGroup>

        {/* Power Toggle */}
        <PowerToggle
          isOn={powerOn}
          onChange={handlePowerChange}
          runStep={runStep}
          readOnly={readOnly}
        />

        {/* Control Row: Level and Temperature */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <Gear size={18} weight="fill" color="#48BB78" />
            <Text
              color="#48BB78"
              fontSize="lg"
              fontWeight="bold"
              minW="40px"
            >
              {level}
            </Text>
            {!readOnly && operatingMode === 'LEVEL' && (
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
          {(() => {
            // Show ambient temp when idle and off, otherwise show core temp
            const displayTemp = (!powerOn && runStep === 'Idle' && heaterAmbientTemp !== null) 
              ? heaterAmbientTemp 
              : burnerCoreTemp
            const showTemp = displayTemp !== null && displayTemp !== undefined
            
            return showTemp ? (
              <HStack spacing={2} align="center">
                <Fire size={18} weight="fill" color="#FB923C" />
                <Text
                  color="#FB923C"
                  fontSize="md"
                  fontWeight="semibold"
                >
                  {displayTemp}°C
                </Text>
              </HStack>
            ) : null
          })()}
        </HStack>

        {/* Electrical Row: Voltage and Current */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <BatteryCharging size={18} weight="fill" color="#FBBF24" />
            <Text color="#FBBF24" fontSize="md" fontWeight="semibold">
              {voltage} V
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <Lightning size={18} weight="fill" color="#FBBF24" />
            <Text color="#FBBF24" fontSize="md" fontWeight="semibold">
              {current} A
            </Text>
          </HStack>
        </HStack>

        {/* Fuel Row 1: Gauge and Lifetime */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <DropHalf size={18} weight="fill" color="#38B2AC" />
            <Text color="#38B2AC" fontSize="md" fontWeight="semibold">
              {fuelGauge} L
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <GasPump size={18} weight="fill" color="#38B2AC" />
            <Text color="#38B2AC" fontSize="md" fontWeight="semibold">
              {lifetimeFuel} L
            </Text>
          </HStack>
        </HStack>

        {/* Fuel Row 2: Rate and Hours Till Empty */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <Gauge size={18} weight="fill" color="#38B2AC" />
            <Text color="#38B2AC" fontSize="md" fontWeight="semibold">
              {fuelConsumptionRate} L/hr
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <GasCanIcon size={18} weight="regular" color="#38B2AC" />
            <Text color="#38B2AC" fontSize="md" fontWeight="semibold">
              {hoursTillEmpty} hrs
            </Text>
          </HStack>
        </HStack>

        {/* Performance Row: Fan Speed and Pump Hz */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <FanIcon size={18} weight="fill" color="#EC4899" />
            <Text color="pink.400" fontSize="md" fontWeight="semibold">
              {fanSpeed} RPM
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <WaveSine size={18} weight="fill" color="#A855F7" />
            <Text color="#A855F7" fontSize="md" fontWeight="semibold">
              {pumpHz} Hz
            </Text>
          </HStack>
        </HStack>

        {/* Runtime Row: Total and Session */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={2} align="center">
            <Hourglass size={18} weight="fill" color="#4299E1" />
            <Text color="#4299E1" fontSize="md" fontWeight="semibold">
              {totalRuntime} hrs
            </Text>
          </HStack>
          <HStack spacing={2} align="center">
            <Timer size={18} weight="fill" color="#4299E1" />
            <Text color="#4299E1" fontSize="md" fontWeight="semibold">
              {formatSessionRuntime(sessionRuntime)}
            </Text>
          </HStack>
        </HStack>

        {/* Seconds Since Last Refresh - Moved to bottom */}
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
      </VStack>

      {/* Level Select Modal */}
      <LevelSelectModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        currentLevel={level}
        onSelectLevel={handleLevelSelect}
      />

      {/* Time Sync Confirmation Modal */}
      <Modal isOpen={isTimeSyncModalOpen} onClose={onTimeSyncModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sync Time</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Sync the local system with UTC time?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTimeSyncModalClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleTimeSync}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default HeaterControl
