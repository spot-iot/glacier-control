import { HStack, Switch, Text, Box, Spinner } from '@chakra-ui/react'

const PowerToggle = ({ isOn, onChange, isPending, pendingValue, readOnly }) => {
  const displayValue = isPending && pendingValue !== undefined ? pendingValue : isOn
  const isDisabled = isPending || readOnly

  return (
    <Box opacity={isPending ? 0.5 : 1} transition="opacity 0.2s">
      <HStack spacing={4} align="center">
        <Text color="gray.300" fontSize="md" fontWeight="medium" minW="80px">
          Power:
        </Text>
        <HStack spacing={2}>
          <Switch
            size="lg"
            colorScheme="green"
            isChecked={displayValue}
            onChange={(e) => onChange(e.target.checked)}
            isDisabled={isDisabled}
            isReadOnly={readOnly}
          />
          {isPending && <Spinner size="sm" color="yellow.400" />}
        </HStack>
        <Text
          color={displayValue ? 'green.400' : 'gray.500'}
          fontSize="md"
          fontWeight="semibold"
          minW="60px"
        >
          {displayValue ? 'ON' : 'OFF'}
          {isPending && ' (pending)'}
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
