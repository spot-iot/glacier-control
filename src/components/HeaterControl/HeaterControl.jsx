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

const HeaterControl = ({ readOnly = false }) => {
  const [powerOn, setPowerOn] = useState(false)
  const [level, setLevel] = useState(5) // Confirmed level from telemetry
  const [runStep, setRunStep] = useState('Unknown')
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

  // Handle telemetry updates from WebSocket
  const handleTelemetryUpdate = useCallback((telemetry) => {
    // Update UI with latest telemetry (confirmed state)
    setPowerOn(telemetry.powerOn)
    setLevel(telemetry.level)
    if (telemetry.runStep) {
      setRunStep(telemetry.runStep)
    }
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
              w={2}
              h={2}
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

        {/* Level Display */}
        {!readOnly && (
          <HStack spacing={3} align="center" justify="center">
            <Text color="gray.300" fontSize="md" fontWeight="medium">
              Level:
            </Text>
            <Text
              color="brand.400"
              fontSize="lg"
              fontWeight="bold"
              minW="40px"
              textAlign="center"
            >
              {level}
            </Text>
            <IconButton
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              colorScheme="brand"
              aria-label="Edit level"
              onClick={() => setIsLevelModalOpen(true)}
            />
          </HStack>
        )}
        {readOnly && (
          <HStack spacing={3} align="center" justify="center">
            <Text color="gray.300" fontSize="md" fontWeight="medium">
              Level:
            </Text>
            <Text
              color="brand.400"
              fontSize="lg"
              fontWeight="bold"
              minW="40px"
              textAlign="center"
            >
              {level}
            </Text>
          </HStack>
        )}

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
