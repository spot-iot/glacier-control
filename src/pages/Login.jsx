import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  return (
    <Container maxW="md" centerContent minH="100vh" justifyContent="center">
      <Box
        w="100%"
        p={8}
        borderRadius="lg"
        bg="gray.800"
        boxShadow="xl"
      >
        <VStack spacing={6}>
          <Heading size="lg" color="white">
            Glacier Control
          </Heading>
          <Heading size="sm" color="gray.400" fontWeight="normal">
            Diesel Heater Control Dashboard
          </Heading>

          <Box as="form" w="100%" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <FormControl isRequired>
                <FormLabel color="gray.300">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="gray.300">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="100%"
                isLoading={isSubmitting}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Container>
  )
}

export default Login
