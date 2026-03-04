import { Box, Text, VStack } from '@chakra-ui/react'

// Placeholder component - will be implemented in Phase 3
const HeaterControl = ({ readOnly = false }) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      boxShadow="md"
      opacity={readOnly ? 0.9 : 1}
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" color="white">
          Heater Control {readOnly && <Text as="span" fontSize="sm" color="gray.500">(Read Only)</Text>}
        </Text>
        <Text color="gray.400">
          Heater controls will be displayed here
          {readOnly && (
            <Text as="span" display="block" fontSize="xs" color="gray.500" mt={2}>
              Controls are disabled in public view
            </Text>
          )}
        </Text>
      </VStack>
    </Box>
  )
}

export default HeaterControl
