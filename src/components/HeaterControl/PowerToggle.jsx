import { HStack, Switch, Text, Box } from '@chakra-ui/react'

const PowerToggle = ({ isOn, onChange, readOnly }) => {
  return (
    <HStack spacing={4} align="center">
      <Text color="gray.300" fontSize="md" fontWeight="medium" minW="80px">
        Power:
      </Text>
      <HStack spacing={2}>
        <Switch
          size="lg"
          colorScheme="green"
          isChecked={isOn}
          onChange={(e) => onChange(e.target.checked)}
          isDisabled={readOnly}
        />
      </HStack>
      <Text
        color={isOn ? 'green.400' : 'gray.500'}
        fontSize="md"
        fontWeight="semibold"
        minW="60px"
      >
        {isOn ? 'ON' : 'OFF'}
      </Text>
    </HStack>
  )
}

export default PowerToggle
