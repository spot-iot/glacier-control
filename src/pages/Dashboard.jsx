import { Box, Container, VStack } from '@chakra-ui/react'
import WeatherWidget from '../components/WeatherWidget/WeatherWidget'
import HeaterControl from '../components/HeaterControl/HeaterControl'
import TemperatureHistory from '../components/TemperatureHistory/TemperatureHistory'
import ActionButtons from '../components/ActionButtons/ActionButtons'

const Dashboard = () => {
  return (
    <Container maxW="container.sm" py={4} px={4}>
      <VStack spacing={4} align="stretch">
        {/* Weather Widget - Top Section */}
        <WeatherWidget readOnly={false} />

        {/* Heater Control Widget */}
        <HeaterControl readOnly={false} />

        {/* Action Buttons */}
        <ActionButtons readOnly={false} />

        {/* Temperature History - Bottom Section */}
        <TemperatureHistory readOnly={false} />
      </VStack>
    </Container>
  )
}

export default Dashboard
