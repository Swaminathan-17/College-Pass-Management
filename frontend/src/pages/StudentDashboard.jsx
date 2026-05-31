import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { passAPI, facultyAPI } from '../services/api'

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const [studentProfile, setStudentProfile] = useState(null)
  const [passes, setPasses] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    passType: 'home',
    reason: '',
    destination: '',
    outDate: '',
    outTime: '',
    expectedReturnTime: '',
    classInchargeId: ''
  })

  useEffect(() => {
    fetchPassHistory()
    fetchStudentProfile()
    fetchFacultyList()
  }, [])

  const fetchStudentProfile = async () => {
    try {
      // Get student profile from backend
      const token = localStorage.getItem('token')
      const response = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const studentData = await response.json()
        setStudentProfile(studentData)
      }
    } catch (error) {
      console.error('Failed to fetch student profile:', error)
    }
  }

  const fetchPassHistory = async () => {
    try {
      const response = await passAPI.getHistory()
      setPasses(response.data)
    } catch (error) {
      setError('Failed to fetch pass history')
    }
  }

  const fetchFacultyList = async () => {
    try {
      const response = await facultyAPI.getList()
      setFacultyList(response.data.filter(f => f.isClassIncharge || f.isHOD))
    } catch (error) {
      console.error('Failed to fetch faculty list:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let updatedFormData = {
      ...formData,
      [name]: value
    }

    // Auto-select HOD when Emergency pass type is selected
    if (name === 'passType' && value === 'emergency') {
      // Find HOD specifically for student's department (case-insensitive matching)
      const studentDepartment = studentProfile?.department?.toLowerCase().trim()
      const hod = facultyList.find(f => 
        f.isHOD && 
        f.department?.toLowerCase().trim() === studentDepartment
      )
      
            
      if (hod) {
        updatedFormData.classInchargeId = hod._id
        setError('') // Clear any previous errors
      } else {
        // If no department-specific HOD found, show detailed error
        const availableHODs = facultyList.filter(f => f.isHOD)
        const hodDepartments = availableHODs.map(h => h.department).join(', ')
        
        if (availableHODs.length === 0) {
          setError('No HODs found in the system. Please contact administration.')
        } else {
          setError(`No HOD found for "${studentProfile?.department}" department. Available HODs for: ${hodDepartments}`)
        }
      }

      // Auto-populate date and time fields for emergency
      const now = new Date()
      const today = now.toISOString().split('T')[0] // Format: YYYY-MM-DD
      const currentTime = now.toTimeString().slice(0, 5) // Format: HH:mm
      const midnight = '23:59' // End of day

      updatedFormData.outDate = today
      updatedFormData.outTime = currentTime
      updatedFormData.expectedReturnTime = midnight
    } else if (name === 'passType' && value !== 'emergency' && formData.passType === 'emergency') {
      // Clear auto-filled fields if pass type changes from emergency
      updatedFormData.outDate = ''
      updatedFormData.outTime = ''
      updatedFormData.expectedReturnTime = ''
      updatedFormData.classInchargeId = ''
      // Clear the HOD error message
      setError('')
    }

    setFormData(updatedFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      await passAPI.requestPass(formData)
      resetForm()
      fetchPassHistory()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit pass request')
    }
  }

  const resetForm = () => {
    setFormData({
      passType: 'home',
      reason: '',
      destination: '',
      outDate: '',
      outTime: '',
      expectedReturnTime: '',
      classInchargeId: ''
    })
    setShowForm(false)
  }

  const downloadPDF = async (passId) => {
    try {
      console.log('🔄 Downloading PDF for pass:', passId)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('❌ No token found')
        alert('Please login again to download PDF')
        return
      }
      
      console.log('📡 Making request to API...')
      const response = await fetch(`/api/pass/pdf-test/${passId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        console.log('✅ PDF generated successfully')
        const blob = await response.blob()
        console.log('📄 Blob size:', blob.size, 'bytes')
        
        const url = window.URL.createObjectURL(blob)
        console.log('🔗 Opening PDF in new tab...')
        
        // Open in new tab
        const newWindow = window.open(url, '_blank')
        
        if (!newWindow) {
          console.error('❌ Popup blocked, trying direct download')
          // Fallback: create download link
          const a = document.createElement('a')
          a.href = url
          a.download = `pass_${passId}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
        
        // Clean up after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to generate PDF:', response.status, errorText)
        alert(`Failed to generate PDF: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error downloading PDF:', error)
      alert('Error downloading PDF. Please try again.')
    }
  }

  const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

const deletePass = async (passId) => {
    if (!window.confirm('Are you sure you want to delete this pass request?')) {
      return
    }
    
    try {
      await passAPI.deletePass(passId)
      setError('')
      fetchPassHistory()
    } catch (error) {
      console.error('Delete error details:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete pass request'
      setError(errorMessage)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      case 'FACULTY_APPROVED': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      case 'WARDEN_APPROVED': return 'bg-green-500/20 text-green-300 border-green-500/50'
      case 'REJECTED': return 'bg-red-500/20 text-red-300 border-red-500/50'
      case 'OUTSIDE': return 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      case 'RETURNED': return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50'
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
              Student Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-300 text-sm">Welcome back,</p>
                <p className="text-cyan-400 font-semibold">{user?.name}</p>
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

        <div className="glass-effect rounded-2xl p-6 mb-6 neon-border animate-slideIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="text-2xl mr-3">🎫</span>
              Pass Management
              <span className="ml-3 text-sm text-cyan-400 bg-cyan-400/20 px-3 py-1 rounded-full">
                Easy Apply ✨
              </span>
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="neon-button px-6 py-2 rounded-lg text-white font-medium text-sm flex items-center"
            >
              {showForm ? (
                <>
                  <span className="mr-2">❌</span>
                  Cancel
                </>
              ) : (
                <>
                  <span className="mr-2">➕</span>
                  Request New Pass
                </>
              )}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-slideIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    🎫 Pass Type
                  </label>
                  <select
                    name="passType"
                    value={formData.passType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                  >
                    <option value="home">Home</option>
                    <option value="medical">Medical</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                    {studentProfile?.residenceType === 'day-scholar' && new Date().getHours() < 12 && (
                      <option value="express">⚡ Express (Same-Day)</option>
                    )}
                    <option value="emergency">🚨 Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    📍 Destination
                  </label>
                  <input
                    name="destination"
                    type="text"
                    required
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    placeholder="Enter destination"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    {formData.passType === 'emergency' ? '👨‍💼 HOD (Auto-selected)' : '👨‍🏫 Class Incharge'}
                  </label>
                  <select
                    name="classInchargeId"
                    value={formData.classInchargeId}
                    onChange={handleChange}
                    required
                    disabled={formData.passType === 'emergency'}
                    className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 ${
                      formData.passType === 'emergency' ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {formData.passType === 'emergency' ? 'HOD will be auto-selected' : 'Select Class Incharge'}
                    </option>
                    {facultyList.map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} - {faculty.designation} ({faculty.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    📅 Out Date 
                    {formData.passType === 'emergency' ? ' (Auto-filled - Today)' : 
                     formData.passType === 'express' ? ' (Express - Same day allowed)' : 
                     formData.passType === 'regular' && studentProfile?.residenceType === 'hosteller' ? ' (Only weekends allowed)' : ''}
                  </label>
                  <input
                    name="outDate"
                    type="date"
                    required
                    value={formData.outDate}
                    onChange={(e) => {
                      const value = e.target.value
                      // Validate date format (YYYY-MM-DD)
                      if (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        handleChange(e)
                      }
                    }}
                    min={formData.passType === 'emergency' || formData.passType === 'express' ? new Date().toISOString().split('T')[0] : getTomorrowDate()}
                    max="2099-12-31"
                    disabled={formData.passType === 'emergency'}
                    className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 ${
                      formData.passType === 'emergency' ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    🕐 Out Time {formData.passType === 'emergency' ? '(Auto-filled - Current Time)' : ''}
                  </label>
                  <input
                    name="outTime"
                    type="time"
                    required
                    value={formData.outTime}
                    onChange={handleChange}
                    disabled={formData.passType === 'emergency'}
                    className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 ${
                      formData.passType === 'emergency' ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">
                    🕐 Expected Return Time {formData.passType === 'emergency' ? '(Auto-filled - End of Day)' : ''}
                  </label>
                  <input
                    name="expectedReturnTime"
                    type="time"
                    required
                    value={formData.expectedReturnTime}
                    onChange={handleChange}
                    disabled={formData.passType === 'emergency'}
                    className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 ${
                      formData.passType === 'emergency' ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">📝 Reason</label>
                <textarea
                  name="reason"
                  required
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                  placeholder="Enter reason for pass request"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="neon-button px-8 py-3 rounded-lg text-white font-medium flex items-center"
                >
                  <span className="mr-2">📤</span>
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="glass-effect rounded-2xl p-6 neon-border animate-slideIn" style={{animationDelay: '0.2s'}}>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">📋</span>
            Pass History
            <span className="ml-auto text-sm text-purple-400 bg-purple-400/20 px-3 py-1 rounded-full">
              Your Records 📚
            </span>
          </h2>
          
          {passes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📭
              </div>
              <p className="text-gray-400 text-lg font-medium">No pass requests found</p>
              <p className="text-gray-500 text-sm mt-2 flex items-center justify-center">
                <span className="mr-2">💡</span>
                Create your first pass request to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-cyan-400 font-semibold">🎫 Type</th>
                    <th className="text-left py-3 px-4 text-cyan-400 font-semibold">📍 Destination</th>
                    <th className="text-left py-3 px-4 text-cyan-400 font-semibold">📅 Date</th>
                    <th className="text-left py-3 px-4 text-cyan-400 font-semibold">🏷️ Status</th>
                    <th className="text-left py-3 px-4 text-cyan-400 font-semibold">⚡ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass, index) => (
                    <tr key={pass._id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-200" style={{animationDelay: `${index * 0.1}s`}}>
                      <td className="py-4 px-4">
                        <span className="text-white font-medium capitalize">{pass.passType}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{pass.destination}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(pass.outDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pass.status)}`}>
                          {pass.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          {(pass.status === 'FACULTY_APPROVED' || pass.status === 'WARDEN_APPROVED' || pass.status === 'HOD_APPROVED' || pass.passCode) && (
                            <button
                              onClick={() => downloadPDF(pass._id)}
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm rounded transition-colors duration-200 shadow hover:shadow-cyan-500/25"
                            >
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => deletePass(pass._id)}
                            className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors duration-200"
                          >
                            Delete
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

export default StudentDashboard
