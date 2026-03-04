import { Box, Text, HStack, VStack } from '@chakra-ui/react'
import ForecastItem from './ForecastItem'

// Placeholder component - will be implemented in Phase 2
const WeatherWidget = ({ readOnly = false }) => {
  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={6}
      boxShadow="md"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Weather Widget
          </Text>
        </HStack>
        <Text color="gray.400">
          Weather data will be displayed here
          {readOnly && <Text as="span" fontSize="xs" color="gray.500" ml={2}>(Read Only)</Text>}
        </Text>
        {/* Forecast items will go here */}
      </VStack>
    </Box>
  )
}

export default WeatherWidget
