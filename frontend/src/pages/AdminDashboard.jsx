import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../services/api'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      setError('Failed to fetch analytics')
    } finally {
      setLoading(false)
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
          <p className="text-cyan-400 neon-text">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-background">
      <div className="glass-effect border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-6xl font-black stylish-title">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300 text-sm">Welcome back,</p>
                <p className="text-purple-400 font-semibold">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-red-500/25"
              >
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

        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn hover:scale-105 transition-transform duration-300">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-400 text-sm font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-cyan-400 neon-text">{analytics.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.1s'}}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-400 text-sm font-medium">Total Passes</p>
                    <p className="text-2xl font-bold text-purple-400 neon-text">{analytics.totalPasses}</p>
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.2s'}}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-400 text-sm font-medium">Approved</p>
                    <p className="text-2xl font-bold text-green-400 neon-text">{analytics.approvedPasses}</p>
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn hover:scale-105 transition-transform duration-300" style={{animationDelay: '0.3s'}}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-400 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400 neon-text">{analytics.pendingPasses}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn" style={{animationDelay: '0.4s'}}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></span>
                  Passes by Status
                </h3>
                <div className="space-y-4">
                  {Object.entries(analytics.passesByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200">
                      <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                      <span className="text-cyan-400 font-bold neon-text">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn" style={{animationDelay: '0.5s'}}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></span>
                  Passes by Type
                </h3>
                <div className="space-y-4">
                  {Object.entries(analytics.passesByType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200">
                      <span className="text-gray-300 capitalize">{type}</span>
                      <span className="text-purple-400 font-bold neon-text">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 glass-effect rounded-2xl p-6 neon-border animate-slideIn" style={{animationDelay: '0.6s'}}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                Student Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-3xl font-bold text-cyan-400 neon-text mb-2">{analytics.activeStudents || 0}</p>
                  <p className="text-gray-400 text-sm">Active Students</p>
                </div>
                <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-3xl font-bold text-purple-400 neon-text mb-2">{analytics.blockedStudents || 0}</p>
                  <p className="text-gray-400 text-sm">Blocked Students</p>
                </div>
                <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-3xl font-bold text-green-400 neon-text mb-2">{analytics.avgPassesPerStudent || 0}</p>
                  <p className="text-gray-400 text-sm">Avg Passes/Student</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-effect rounded-2xl p-12 text-center neon-border">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400">No analytics data available</p>
            <p className="text-gray-500 text-sm mt-2">Start using the system to see statistics</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
