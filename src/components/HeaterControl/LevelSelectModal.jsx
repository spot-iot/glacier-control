import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Button,
  Text,
} from '@chakra-ui/react'

const LevelSelectModal = ({ isOpen, onClose, currentLevel, onSelectLevel }) => {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const handleLevelClick = (level) => {
    onSelectLevel(level)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', md: 'md' }}>
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader fontSize="xl" fontWeight="bold">
          Set Heater Level
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text fontSize="sm" color="gray.400" mb={4} textAlign="center">
            Select a level from 1 to 10
          </Text>
          <SimpleGrid columns={3} spacing={3}>
            {levels.map((level) => (
              <Button
                key={level}
                size="lg"
                colorScheme={level === currentLevel ? 'green' : 'brand'}
                variant={level === currentLevel ? 'solid' : 'outline'}
                onClick={() => handleLevelClick(level)}
                fontSize="xl"
                fontWeight="bold"
                h="60px"
                _hover={{
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s',
                }}
              >
                {level}
              </Button>
            ))}
          </SimpleGrid>
          {currentLevel && (
            <Text fontSize="xs" color="gray.500" textAlign="center" mt={4}>
              Current level: {currentLevel}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default LevelSelectModal
