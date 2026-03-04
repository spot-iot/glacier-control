import { Box, HStack, Button } from '@chakra-ui/react'

// Placeholder component - will be implemented in Phase 5
const ActionButtons = ({ readOnly = false }) => {
  // Hide action buttons in public/read-only view
  if (readOnly) {
    return null
  }

  return (
    <Box>
      <HStack spacing={4}>
        <Button colorScheme="brand" size="lg" flex={1}>
          Sync Time
        </Button>
        {/* Placeholder buttons will go here */}
      </HStack>
    </Box>
  )
}

export default ActionButtons
