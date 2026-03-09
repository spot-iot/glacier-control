import { api } from './api'

/**
 * Heater Control Service
 * Sends commands to control the diesel heater via XANO backend
 */

// Get device UID from environment variable
const DEVICE_UID = import.meta.env.VITE_HEATER_DEVICE_UID || '345F4537C1B0'

/**
 * Send a generic command to the heater
 * @param {string} commandType - Command type: "POWER", "LEVEL", "TIMESYNC"
 * @param {number} commandValue - Command value (0/1 for POWER, 1-10 for LEVEL, 1 for TIMESYNC)
 * @returns {Promise<{success: boolean, commandId?: number, message?: string, error?: string}>}
 */
export const sendCommand = async (commandType, commandValue) => {
  try {
    const response = await api.post('/users/command/send_new', {
      command: {
        device_uid: DEVICE_UID,
        command_type: commandType,
        command_value: commandValue,
        origin: 'REMOTE',
      },
    })

    // XANO returns: { id, created_at, device_target, command_type, command_value, status, ... }
    return {
      success: true,
      commandId: response.data.id, // Command ID for tracking
      message: response.data?.message || 'Command sent successfully',
      data: response.data,
    }
  } catch (error) {
    console.error('Command send error:', error)
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'Failed to send command',
    }
  }
}

/**
 * Send power command (on/off)
 * @param {boolean} powerOn - true to turn on, false to turn off
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendPowerCommand = async (powerOn) => {
  const commandValue = powerOn ? 1 : 0
  return sendCommand('POWER', commandValue)
}

/**
 * Send level command (1-10)
 * @param {number} level - Level value (1-10)
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendLevelCommand = async (level) => {
  // Validate level range
  if (level < 1 || level > 10) {
    return {
      success: false,
      error: 'Level must be between 1 and 10',
    }
  }
  return sendCommand('LEVEL', level)
}

/**
 * Send time sync command
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendTimeSyncCommand = async () => {
  return sendCommand('TIMESYNC', 1)
}

/**
 * Send mode command (LEVEL=0, AUTO=1, FROST=2)
 * @param {string} modeValue - Mode string ("LEVEL", "AUTO", or "FROST")
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendModeCommand = async (modeValue) => {
  // Map mode string to numeric value: LEVEL=0, AUTO=1, FROST=2
  const modeMap = { 'LEVEL': 0, 'AUTO': 1, 'FROST': 2 }
  const numericValue = modeMap[modeValue]
  
  if (numericValue === undefined) {
    return {
      success: false,
      error: 'Mode must be "LEVEL", "AUTO", or "FROST"',
    }
  }
  
  return sendCommand('MODE', numericValue)
}
