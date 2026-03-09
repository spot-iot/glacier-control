import { HStack, Switch, Text, Box } from '@chakra-ui/react'

const PowerToggle = ({ isOn, onChange, runStep, readOnly }) => {
  return (
    <HStack spacing={4} align="center">
      <HStack spacing={2}>
        <Switch
          size="lg"
          isChecked={isOn}
          onChange={(e) => onChange(e.target.checked)}
          isDisabled={readOnly}
        />
      </HStack>
      <Text
        color={isOn ? 'brand.400' : 'gray.500'}
        fontSize="md"
        fontWeight="semibold"
        minW="60px"
      >
        {isOn ? 'ON' : 'OFF'}
      </Text>
      {runStep && (
        <Text
          color="gray.400"
          fontSize="sm"
          fontWeight="normal"
          ml="auto"
        >
          {runStep}
        </Text>
      )}
    </HStack>
  )
}

export default PowerToggle
