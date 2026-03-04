import { Box, Text, VStack } from '@chakra-ui/react'

// Placeholder component - will be implemented in Phase 4
const TemperatureHistory = ({ readOnly = false }) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      boxShadow="md"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" color="white">
          Temperature History
          {readOnly && <Text as="span" fontSize="sm" color="gray.500" ml={2}>(Read Only)</Text>}
        </Text>
        <Text color="gray.400">
          Temperature history and charts will be displayed here
        </Text>
      </VStack>
    </Box>
  )
}

export default TemperatureHistory
