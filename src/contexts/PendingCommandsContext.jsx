import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const PendingCommandsContext = createContext(null)

/**
 * Pending Commands Context
 * Tracks pending commands and their confirmation status
 */
export const PendingCommandsProvider = ({ children }) => {
  const [pendingCommands, setPendingCommands] = useState(new Map())
  const timeoutTimersRef = useRef(new Map())

  // Clear timeout timer for a command
  const clearTimeoutTimer = useCallback((commandId) => {
    const timer = timeoutTimersRef.current.get(commandId)
    if (timer) {
      clearTimeout(timer)
      timeoutTimersRef.current.delete(commandId)
    }
  }, [])

  // Add a pending command
  const addPendingCommand = useCallback((commandId, commandData) => {
    setPendingCommands((prev) => {
      const newMap = new Map(prev)
      newMap.set(commandId, {
        ...commandData,
        timestamp: Date.now(),
      })
      return newMap
    })

    // Set timeout (45 seconds)
    const timer = setTimeout(() => {
      setPendingCommands((prev) => {
        const newMap = new Map(prev)
        const command = newMap.get(commandId)
        if (command) {
          // Mark as timeout
          newMap.set(commandId, {
            ...command,
            status: 'timeout',
          })
        }
        return newMap
      })
      clearTimeoutTimer(commandId)
    }, 45000) // 45 seconds

    timeoutTimersRef.current.set(commandId, timer)
  }, [clearTimeoutTimer])

  // Check if a command ID exists in pending commands (and hasn't timed out)
  const hasPendingCommandId = useCallback((commandId) => {
    const command = pendingCommands.get(commandId)
    return command && command.status !== 'timeout'
  }, [pendingCommands])

  // Remove a pending command (when confirmed or failed)
  const removePendingCommand = useCallback((commandId) => {
    setPendingCommands((prev) => {
      const newMap = new Map(prev)
      newMap.delete(commandId)
      return newMap
    })
    clearTimeoutTimer(commandId)
  }, [clearTimeoutTimer])

  // Check if there's a pending command of a specific type
  const hasPendingCommand = useCallback((commandType) => {
    for (const [id, command] of pendingCommands) {
      if (command.type === commandType && command.status !== 'timeout') {
        return true
      }
    }
    return false
  }, [pendingCommands])

  // Get pending command for a specific type
  const getPendingCommand = useCallback((commandType) => {
    for (const [id, command] of pendingCommands) {
      if (command.type === commandType && command.status !== 'timeout') {
        return { id, ...command }
      }
    }
    return null
  }, [pendingCommands])

  // Get pending command by ID
  const getPendingCommandById = useCallback((commandId) => {
    const command = pendingCommands.get(commandId)
    if (command && command.status !== 'timeout') {
      return { id: commandId, ...command }
    }
    return null
  }, [pendingCommands])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      timeoutTimersRef.current.forEach((timer) => clearTimeout(timer))
      timeoutTimersRef.current.clear()
    }
  }, [])

  const value = {
    pendingCommands,
    addPendingCommand,
    removePendingCommand,
    hasPendingCommand,
    hasPendingCommandId,
    getPendingCommand,
    getPendingCommandById,
  }

  return (
    <PendingCommandsContext.Provider value={value}>
      {children}
    </PendingCommandsContext.Provider>
  )
}

export const usePendingCommands = () => {
  const context = useContext(PendingCommandsContext)
  if (!context) {
    throw new Error('usePendingCommands must be used within PendingCommandsProvider')
  }
  return context
}
