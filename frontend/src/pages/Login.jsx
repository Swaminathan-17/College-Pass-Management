import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { facultyAPI } from '../services/api'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    rollNo: '',
    department: '',
    year: '',
    class: '',
    residenceType: '',
    phone: '',
    parentPhone: '',
    parentEmail: '',
    classInchargeId: '',
    facultyDepartment: '',
    designation: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [facultyList, setFacultyList] = useState([])
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const fetchFacultyList = async () => {
    try {
      const response = await facultyAPI.getList()
      setFacultyList(response.data.filter(f => f.isClassIncharge))
    } catch (error) {
      console.error('Failed to fetch faculty list:', error)
    }
  }

  useEffect(() => {
    if (!isLogin) {
      fetchFacultyList()
    }
  }, [isLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        const studentDetails = formData.role === 'student' ? {
          rollNo: formData.rollNo,
          department: formData.department,
          year: parseInt(formData.year),
          class: formData.class,
          residenceType: formData.residenceType,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          parentEmail: formData.parentEmail,
          classInchargeId: formData.classInchargeId
        } : undefined

        const facultyDetails = formData.role === 'faculty' ? {
          department: formData.facultyDepartment,
          designation: formData.designation
        } : undefined

        result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          studentDetails,
          facultyDetails
        })
      }

      if (result.success) {
        const role = isLogin ? 
          JSON.parse(localStorage.getItem('user')).role : 
          formData.role
        
        switch (role) {
          case 'student':
            navigate('/student')
            break
          case 'faculty':
            navigate('/faculty')
            break
          case 'warden':
            navigate('/warden')
            break
          case 'security':
            navigate('/security')
            break
          case 'admin':
            navigate('/admin')
            break
          default:
            navigate('/login')
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500 rounded-full opacity-20 blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500 rounded-full opacity-10 blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 neon-border animate-slideIn">
          <div className="text-center mb-6">
            <h1 className="text-8xl font-black stylish-title mb-4">
              CPMS
            </h1>
            <p className="text-xl content-text text-gray-200 uppercase tracking-widest">
              College Pass Management System
            </p>
            <h2 className="mt-6 text-3xl font-bold content-text">
              {isLogin ? 'Access Portal' : 'Create Account'}
            </h2>
            <p className="mt-2 text-gray-300 content-text text-sm">
              {isLogin ? 'Enter your credentials to access the system' : 'Register to get started'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm animate-slideIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div className="animate-slideIn" style={{animationDelay: '0.1s'}}>
                  <label className="block text-sm font-medium text-cyan-400 mb-1">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="animate-slideIn" style={{animationDelay: '0.2s'}}>
                  <label className="block text-sm font-medium text-cyan-400 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="warden">Warden</option>
                    <option value="security">Security</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div className="space-y-3 animate-slideIn" style={{animationDelay: '0.3s'}}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Roll No</label>
                        <input
                          name="rollNo"
                          type="text"
                          required
                          value={formData.rollNo}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                          placeholder="Roll number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Year</label>
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Department</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                        >
                          <option value="">Select Department</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Electrical & Electronics">Electrical & Electronics</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Chemical Engineering">Chemical Engineering</option>
                          <option value="Biotechnology">Biotechnology</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="English">English</option>
                          <option value="Management">Management</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Class</label>
                        <input
                          name="class"
                          type="text"
                          required
                          value={formData.class}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                          placeholder="e.g., A, B, C or Section name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Residence Type</label>
                        <select
                          name="residenceType"
                          value={formData.residenceType}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                        >
                          <option value="">Select Residence Type</option>
                          <option value="hosteller">Hosteller</option>
                          <option value="day-scholar">Day Scholar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Phone</label>
                        <input
                          name="phone"
                          type="text"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Parent Phone</label>
                        <input
                          name="parentPhone"
                          type="text"
                          required
                          value={formData.parentPhone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                          placeholder="Parent phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-1">Parent Email</label>
                        <input
                          name="parentEmail"
                          type="email"
                          required
                          value={formData.parentEmail}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                          placeholder="Parent email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cyan-400 mb-1">Class Incharge</label>
                      <select
                        name="classInchargeId"
                        value={formData.classInchargeId}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                      >
                        <option value="">Select Class Incharge</option>
                        {facultyList.map((faculty) => (
                          <option key={faculty._id} value={faculty._id}>
                            {faculty.name} - {faculty.designation} ({faculty.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.role === 'faculty' && (
                  <div className="grid grid-cols-1 gap-3 animate-slideIn" style={{animationDelay: '0.3s'}}>
                    <div>
                      <label className="block text-sm font-medium text-cyan-400 mb-1">Department</label>
                      <select
                        name="facultyDepartment"
                        value={formData.facultyDepartment}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Chemical Engineering">Chemical Engineering</option>
                        <option value="Biotechnology">Biotechnology</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English">English</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-400 mb-1">Designation</label>
                      <input
                        name="designation"
                        type="text"
                        required
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                        placeholder="e.g., Assistant Professor, Associate Professor"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="grid grid-cols-1 gap-2 animate-slideIn" style={{animationDelay: '0.4s'}}>
              <label className="block text-sm font-medium text-cyan-400 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="animate-slideIn" style={{animationDelay: '0.5s'}}>
              <label className="block text-sm font-medium text-cyan-400 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div className="animate-slideIn" style={{animationDelay: '0.6s'}}>
              <button
                type="submit"
                disabled={loading}
                className="w-full neon-button px-4 py-2 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="loading-dots justify-center">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  isLogin ? 'Access System' : 'Create Account'
                )}
              </button>
            </div>

            <div className="text-center animate-slideIn" style={{animationDelay: '0.7s'}}>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300 text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
