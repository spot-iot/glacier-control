import { VStack, HStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Box, Spinner } from '@chakra-ui/react'

const LevelSlider = ({ level, onChange, onChangeEnd, isPending, pendingValue, readOnly }) => {
  const displayValue = isPending && pendingValue !== undefined ? pendingValue : level
  const isDisabled = isPending || readOnly

  return (
    <Box opacity={isPending ? 0.5 : 1} transition="opacity 0.2s">
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text color="gray.300" fontSize="md" fontWeight="medium">
            Level:
          </Text>
          <HStack spacing={2}>
            <Text
              color="brand.400"
              fontSize="lg"
              fontWeight="bold"
              minW="40px"
              textAlign="right"
            >
              {displayValue}
            </Text>
            {isPending && <Spinner size="sm" color="yellow.400" />}
          </HStack>
        </HStack>
        <Slider
          value={displayValue}
          min={1}
          max={10}
          step={1}
          onChange={onChange}
          onChangeEnd={onChangeEnd}
          isDisabled={isDisabled}
          colorScheme="brand"
          size="lg"
        >
          <SliderTrack bg="gray.700">
            <SliderFilledTrack bg="brand.500" />
          </SliderTrack>
          <SliderThumb boxSize={6} />
        </Slider>
        <HStack justify="space-between" fontSize="xs" color="gray.500" px={1}>
          <Text>1</Text>
          <Text>10</Text>
        </HStack>
        {isPending && (
          <Text fontSize="xs" color="yellow.400" textAlign="center">
            Waiting for confirmation...
          </Text>
        )}
      </VStack>
      {readOnly && (
        <Text fontSize="xs" color="gray.500" mt={2}>
          Controls disabled in public view
        </Text>
      )}
    </Box>
  )
}

export default LevelSlider
