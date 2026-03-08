import { VStack, HStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react'

const LevelSlider = ({ level, onChange, onChangeEnd, readOnly }) => {
  return (
    <VStack spacing={2} align="stretch">
      <HStack justify="space-between">
        <Text color="gray.300" fontSize="md" fontWeight="medium">
          Level:
        </Text>
        <Text
          color="brand.400"
          fontSize="lg"
          fontWeight="bold"
          minW="40px"
          textAlign="right"
        >
          {level}
        </Text>
      </HStack>
      <Slider
        value={level}
        min={1}
        max={10}
        step={1}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
        isDisabled={readOnly}
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
    </VStack>
  )
}

export default LevelSlider
