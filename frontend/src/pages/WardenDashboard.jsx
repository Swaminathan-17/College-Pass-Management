import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { passAPI } from '../services/api'

const WardenDashboard = () => {
  const { user, logout } = useAuth()
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPendingPasses()
  }, [])

  const fetchPendingPasses = async () => {
    try {
      const response = await passAPI.getPending()
      setPasses(response.data.filter(pass => pass.status === 'FACULTY_APPROVED'))
      setError('')
    } catch (error) {
      setError('Failed to fetch pending passes')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (passId) => {
    try {
      await passAPI.wardenApprove(passId)
      setError('')
      fetchPendingPasses()
    } catch (error) {
      setError('Failed to approve pass')
    }
  }

  const handleReject = async (passId) => {
    try {
      await passAPI.wardenReject(passId)
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
            <h1 className="text-6xl font-black stylish-title">
              Warden Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300 text-sm">Welcome back,</p>
                <p className="text-green-400 font-semibold">{user?.name}</p>
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

        <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
            Faculty Approved Pass Requests
          </h2>
          
          {passes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400">No faculty approved pass requests</p>
              <p className="text-gray-500 text-sm mt-2">All faculty approved passes have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Student</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Roll No</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Destination</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Out Date</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Reason</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Residence</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Faculty Remark</th>
                    <th className="text-left py-3 px-4 text-green-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass, index) => (
                    <tr key={pass._id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-200" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-medium">{pass.studentId?.userId?.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{pass.studentId?.rollNo || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <span className="text-white font-medium capitalize">{pass.passType}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{pass.destination}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(pass.outDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300 max-w-xs truncate">{pass.reason}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pass.studentId?.residenceType === 'hosteller' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                            : 'bg-green-500/20 text-green-300 border border-green-500/50'
                        }`}>
                          {pass.studentId?.residenceType === 'hosteller' ? 'Hosteller' : 'Day-Scholar'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300 max-w-xs truncate">{pass.facultyRemark}</td>
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

export default WardenDashboard
