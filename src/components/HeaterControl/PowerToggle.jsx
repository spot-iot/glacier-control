import { HStack, Switch, Text, Box } from '@chakra-ui/react'

const PowerToggle = ({ isOn, onChange, isLoading, readOnly }) => {
  return (
    <Box>
      <HStack spacing={4} align="center">
        <Text color="gray.300" fontSize="md" fontWeight="medium" minW="80px">
          Power:
        </Text>
        <Switch
          size="lg"
          colorScheme="green"
          isChecked={isOn}
          onChange={(e) => onChange(e.target.checked)}
          isDisabled={isLoading || readOnly}
          isReadOnly={readOnly}
        />
        <Text
          color={isOn ? 'green.400' : 'gray.500'}
          fontSize="md"
          fontWeight="semibold"
          minW="60px"
        >
          {isOn ? 'ON' : 'OFF'}
        </Text>
      </HStack>
      {readOnly && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          Controls disabled in public view
        </Text>
      )}
    </Box>
  )
}

export default PowerToggle
