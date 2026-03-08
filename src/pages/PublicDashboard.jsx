import { Box, Container, VStack, Alert, AlertIcon, AlertDescription } from '@chakra-ui/react'
import WeatherWidget from '../components/WeatherWidget/WeatherWidget'
import HeaterControl from '../components/HeaterControl/HeaterControl'
import ActionButtons from '../components/ActionButtons/ActionButtons'

const PublicDashboard = () => {
  return (
    <Container maxW="container.sm" py={4} px={4}>
      <VStack spacing={4} align="stretch">
        {/* Public View Banner */}
        <Alert status="info" borderRadius="md" bg="blue.900" borderColor="blue.700">
          <AlertIcon color="blue.300" />
          <AlertDescription color="blue.100">
            <strong>Public View</strong> - This is a read-only dashboard. Controls are disabled for security.
          </AlertDescription>
        </Alert>

        {/* Weather Widget - Top Section */}
        <WeatherWidget readOnly={true} />

        {/* Heater Control Widget - Read Only */}
        <HeaterControl readOnly={true} />

        {/* Action Buttons - Hidden in public view */}
        {/* <ActionButtons readOnly={true} /> */}
      </VStack>
    </Container>
  )
}

export default PublicDashboard
