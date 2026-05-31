import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import WardenDashboard from './pages/WardenDashboard'
import SecurityDashboard from './pages/SecurityDashboard'
import AdminDashboard from './pages/AdminDashboard'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" />
  }
  
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen gradient-background">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/student" element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/faculty" element={
              <ProtectedRoute allowedRole="faculty">
                <FacultyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/warden" element={
              <ProtectedRoute allowedRole="warden">
                <WardenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/security" element={
              <ProtectedRoute allowedRole="security">
                <SecurityDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
