import { useState } from 'react'
import { Box, HStack, Button, useToast, Spinner } from '@chakra-ui/react'
import { sendTimeSyncCommand } from '../../services/heaterService'

const ActionButtons = ({ readOnly = false }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const toast = useToast()

  // Hide action buttons in public/read-only view
  if (readOnly) {
    return null
  }

  const handleSyncTime = async () => {
    setIsSyncing(true)
    const result = await sendTimeSyncCommand()

    if (result.success) {
      toast({
        title: 'Time synced',
        description: 'Heater time synchronized successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Sync failed',
        description: result.error || 'Failed to sync time',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    setIsSyncing(false)
  }

  return (
    <Box>
      <HStack spacing={4}>
        <Button
          colorScheme="brand"
          size="lg"
          flex={1}
          onClick={handleSyncTime}
          isLoading={isSyncing}
          loadingText="Syncing..."
          leftIcon={isSyncing ? <Spinner size="sm" /> : null}
        >
          Sync Time
        </Button>
        {/* Placeholder buttons for future features */}
      </HStack>
    </Box>
  )
}

export default ActionButtons
