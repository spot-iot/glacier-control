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

const LevelSelectModal = ({ isOpen, onClose, currentLevel, onSelectLevel, pendingLevel }) => {
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
            {levels.map((level) => {
              const isCurrent = level === currentLevel && !pendingLevel
              const isPending = level === pendingLevel
              
              return (
                <Button
                  key={level}
                  size="lg"
                  bg={
                    isCurrent
                      ? '#48BB78'
                      : isPending
                        ? 'gray.600'
                        : 'transparent'
                  }
                  color={
                    isCurrent
                      ? 'white'
                      : isPending
                        ? 'gray.200'
                        : 'gray.300'
                  }
                  borderColor={
                    isCurrent || isPending
                      ? 'transparent'
                      : 'gray.600'
                  }
                  variant={isCurrent || isPending ? 'solid' : 'outline'}
                  onClick={() => handleLevelClick(level)}
                  fontSize="xl"
                  fontWeight="bold"
                  h="60px"
                  gridColumn={level === 10 ? '2' : 'auto'}
                  _hover={{
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s',
                    bg: isCurrent ? '#48BB78' : isPending ? 'gray.600' : 'gray.700',
                  }}
                >
                  {level}
                </Button>
              )
            })}
          </SimpleGrid>
          {currentLevel && (
            <Text fontSize="xs" color="#48BB78" textAlign="center" mt={4}>
              Current level: {currentLevel}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default LevelSelectModal
