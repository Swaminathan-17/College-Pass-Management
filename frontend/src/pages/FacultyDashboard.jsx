import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { passAPI } from '../services/api'

const FacultyDashboard = () => {
  const { user, logout } = useAuth()
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isHOD, setIsHOD] = useState(false)

  useEffect(() => {
    fetchPendingPasses()
  }, [])

  const fetchPendingPasses = async () => {
    try {
      const response = await passAPI.getPending()
      
      // Check if current user is an HOD by checking if user name contains "HOD"
      // This is a simple detection since the backend handles the actual filtering
      const isUserHOD = user.name?.toLowerCase().includes('hod')
      setIsHOD(isUserHOD)
      
      // The backend already filters based on user role, so we just need to display what we get
      // For HODs, backend returns emergency passes; for faculty, returns regular passes
      setPasses(response.data)
      setError('')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pending passes'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (passId) => {
    try {
      // Use HOD approval for emergency passes, faculty approval for regular passes
      if (isHOD) {
        await passAPI.hodApprove(passId)
      } else {
        await passAPI.facultyApprove(passId)
      }
      setError('')
      fetchPendingPasses()
    } catch (error) {
      setError('Failed to approve pass')
    }
  }

  const handleReject = async (passId) => {
    try {
      // Use HOD rejection for emergency passes, faculty rejection for regular passes
      if (isHOD) {
        await passAPI.hodReject(passId)
      } else {
        await passAPI.facultyReject(passId)
      }
      setError('')
      fetchPendingPasses()
    } catch (error) {
      setError('Failed to reject pass')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-background">
        <div className="text-center">
          <div className="loading-dots justify-center mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-cyan-400 neon-text">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-background">
      <div className="glass-effect border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-6xl font-black stylish-title flex items-center">
              <span className="mr-4">{isHOD ? '👨‍💼' : '👨‍🏫'}</span>
              {isHOD ? 'HOD Dashboard' : 'Faculty Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300 text-sm">Welcome back,</p>
                <p className="text-blue-400 font-semibold">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-red-500/25 flex items-center"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 animate-slideIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">{isHOD ? '🚨' : '📋'}</span>
            {isHOD ? 'Emergency Pass Requests' : 'Pending Pass Requests'}
            <span className="ml-auto text-sm text-cyan-400 bg-cyan-400/20 px-3 py-1 rounded-full">
              {isHOD ? 'Urgent ⚡' : 'Review Needed ✍️'}
            </span>
          </h2>
          
          {passes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                {isHOD ? '🚫' : '✅'}
              </div>
              <p className="text-gray-400 text-lg font-medium">
                {isHOD ? 'No emergency pass requests' : 'No pending pass requests'}
              </p>
              <p className="text-gray-500 text-sm mt-2 flex items-center justify-center">
                <span className="mr-2">💡</span>
                {isHOD ? 'No emergency passes have been submitted' : 'All requests have been processed'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-blue-400 font-semibold">👤 Student</th>
                    <th className="text-left py-3 px-4 text-blue-400 font-semibold">📍 Destination</th>
                    <th className="text-left py-3 px-4 text-blue-400 font-semibold">📅 Date</th>
                    <th className="text-left py-3 px-4 text-blue-400 font-semibold">📝 Reason</th>
                    <th className="text-left py-3 px-4 text-blue-400 font-semibold">⚡ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass, index) => (
                    <tr key={pass._id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-200" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-medium">{pass.studentId?.userId?.name || 'Unknown'}</p>
                          <p className="text-gray-400 text-sm">{pass.studentId?.rollNo || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{pass.destination}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(pass.outDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300 max-w-xs truncate">{pass.reason}</td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(pass._id)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(pass._id)}
                            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacultyDashboard
