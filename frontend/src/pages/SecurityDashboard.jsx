import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { passAPI } from '../services/api'

const SecurityDashboard = () => {
  const { user, logout } = useAuth()
  const [rollNo, setRollNo] = useState('')
  const [passCode, setPassCode] = useState('')
  const [verifiedPass, setVerifiedPass] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationHistory, setVerificationHistory] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setVerifiedPass(null)

    try {
      const response = await passAPI.verifyPass({ rollNo, passCode })
      setVerifiedPass(response.data)
      setSuccess('Pass verified successfully')
    } catch (error) {
      setError(error.response?.data?.message || 'Pass verification failed')
    }
  }

  const handleMarkExit = async (passId) => {
    try {
      await passAPI.markExit(passId)
      setSuccess('Exit time marked successfully')
      setVerifiedPass(null)
      setRollNo('')
      setPassCode('')
    } catch (error) {
      setError('Failed to mark exit time')
    }
  }

  const handleMarkReturn = async (passId) => {
    try {
      await passAPI.markReturn(passId)
      setSuccess('Return time marked successfully')
      setVerifiedPass(null)
      setRollNo('')
      setPassCode('')
    } catch (error) {
      setError('Failed to mark return time')
    }
  }

  useEffect(() => {
    fetchVerificationHistory()
  }, [currentPage])

  const fetchVerificationHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await passAPI.getVerificationHistory({ page: currentPage, limit: 20 })
      setVerificationHistory(response.data.verifications)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Error fetching verification history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
      case 'FACULTY_APPROVED': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      case 'HOD_APPROVED': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      case 'WARDEN_APPROVED': return 'bg-green-500/20 text-green-300 border border-green-500/30'
      case 'REJECTED': return 'bg-red-500/20 text-red-300 border border-red-500/30'
      case 'OUTSIDE': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse'
      case 'RETURNED': return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
    }
  }

  const getActionButtons = (pass) => {
    const approvedStatuses = ['FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED'];
    
    if (approvedStatuses.includes(pass.status)) {
      return (
        <button
          onClick={() => handleMarkExit(pass._id)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-green-500/25 flex items-center text-lg"
        >
          <span className="mr-3 text-xl">🚪</span>
          Check Out
        </button>
      );
    }
    
    if (pass.status === 'OUTSIDE') {
      return (
        <button
          onClick={() => handleMarkReturn(pass._id)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/25 flex items-center text-lg animate-pulse"
        >
          <span className="mr-3 text-xl">🏠</span>
          Check In
        </button>
      );
    }
    
    return null;
  }

  return (
    <div className="min-h-screen gradient-background">
      <div className="glass-effect border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/login'}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                ← Back to Login
              </button>
              <h1 className="text-6xl font-black stylish-title flex items-center">
                <span className="mr-4">🛡️</span>
                Security Dashboard
              </h1>
            </div>
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
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm animate-slideIn">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm animate-slideIn">
            <div className="flex items-center">
              <span className="mr-2">✅</span>
              {success}
            </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn mb-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Verify Pass</h2>
              <p className="text-gray-300">Enter student details to verify gate pass</p>
            </div>
          </div>
            
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter roll number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pass Code</label>
                <input
                  type="text"
                  required
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter pass code"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg hover:shadow-cyan-500/25 flex items-center"
              >
                <span className="mr-2">🔍</span>
                Verify Pass
              </button>
            </div>
          </form>
        </div>

        {verifiedPass && (
          <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Pass Details</h2>
                <p className="text-gray-300">Student pass information verified</p>
              </div>
            </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-400">Student Roll No</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.studentId?.rollNo}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Pass Code</p>
                <p className="text-lg text-white font-semibold font-mono">{verifiedPass.passCode}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Pass Type</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.passType}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Destination</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.destination}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Out Date</p>
                <p className="text-lg text-white font-semibold">{new Date(verifiedPass.outDate).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Out Time</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.outTime}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Expected Return</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.expectedReturnTime}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-400">Status</p>
                <span className={`px-3 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(verifiedPass.status)}`}>
                  {verifiedPass.status}
                </span>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-400">Reason</p>
                <p className="text-lg text-white font-semibold">{verifiedPass.reason}</p>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              {getActionButtons(verifiedPass)}
            </div>
          </div>
        )}

        {/* Verification History Section */}
        <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Verification History</h2>
                <p className="text-gray-300">Recent security verifications and check-ins/outs</p>
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pass Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Approved By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {verificationHistory.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(record.verifiedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{record.studentDetails.name}</div>
                          <div className="text-sm text-gray-400">{record.studentDetails.rollNo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">
                        {record.passDetails.passCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.verificationType === 'VERIFY' ? 'bg-blue-500/20 text-blue-300' :
                          record.verificationType === 'CHECK_OUT' ? 'bg-green-500/20 text-green-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {record.verificationType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {record.passDetails.destination}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <div className="space-y-1">
                          {record.approvalDetails.facultyName && (
                            <div className="text-xs">👨‍🏫 {record.approvalDetails.facultyName}</div>
                          )}
                          {record.approvalDetails.hodName && (
                            <div className="text-xs">👨‍💼 {record.approvalDetails.hodName}</div>
                          )}
                          {record.approvalDetails.wardenName && (
                            <div className="text-xs">🛡️ {record.approvalDetails.wardenName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {record.securityPersonnel?.name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {verificationHistory.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No verification history found
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecurityDashboard
