import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PublicDashboard from './pages/PublicDashboard'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PendingCommandsProvider } from './contexts/PendingCommandsContext'
import ErrorBoundary from './components/ErrorBoundary'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        Loading...
      </Box>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PendingCommandsProvider>
          <Router>
          <Box minH="100vh" bg="#1a1a1a">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/public" element={<PublicDashboard />} />
              <Route path="/view" element={<PublicDashboard />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Router>
        </PendingCommandsProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
