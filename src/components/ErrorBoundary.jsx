import { Component } from 'react'
import { Box, Text, Button, VStack } from '@chakra-ui/react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} bg="red.900" color="white" minH="100vh">
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold">
              Something went wrong
            </Text>
            <Text fontSize="sm" color="red.200">
              {this.state.error?.message || 'Unknown error'}
            </Text>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Reload Page
            </Button>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
