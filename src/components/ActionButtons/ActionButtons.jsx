import { useState } from 'react'
import { Box, HStack, Button, useToast, Spinner } from '@chakra-ui/react'
import { sendTimeSyncCommand } from '../../services/heaterService'

const ActionButtons = ({ readOnly = false }) => {
  // Hide action buttons in public/read-only view
  // Note: Sync Time button has been moved to HeaterControl component
  if (readOnly) {
    return null
  }

  return (
    <Box>
      {/* Placeholder for future action buttons */}
    </Box>
  )
}

export default ActionButtons
