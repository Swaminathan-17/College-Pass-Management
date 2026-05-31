import axios from 'axios'

const API_BASE_URL = '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
}

// Pass API
export const passAPI = {
  requestPass: (passData) => api.post('/pass/request', passData),
  getHistory: () => api.get('/pass/history'),
  getPending: () => api.get('/pass/pending'),
  deletePass: (id) => api.delete(`/pass/${id}`),
  facultyApprove: (id, remark) => api.put(`/pass/faculty-approve/${id}`, { remark }),
  facultyReject: (id, remark) => api.put(`/pass/faculty-reject/${id}`, { remark }),
  hodApprove: (id, remark) => api.put(`/pass/hod-approve/${id}`, { remark }),
  hodReject: (id, remark) => api.put(`/pass/hod-reject/${id}`, { remark }),
  wardenApprove: (id, remark) => api.put(`/pass/warden-approve/${id}`, { remark }),
  wardenReject: (id, remark) => api.put(`/pass/warden-reject/${id}`, { remark }),
  verifyPass: (data) => api.post('/pass/verify', data),
  markExit: (id) => api.put(`/pass/exit/${id}`),
  markReturn: (id) => api.put(`/pass/return/${id}`),
  getVerificationHistory: (params) => api.get('/pass/verification-history', { params }),
}

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
}

// Faculty API
export const facultyAPI = {
  getList: () => api.get('/faculty/list'),
  getByDepartment: (department) => api.get(`/faculty/department/${department}`),
  getById: (id) => api.get(`/faculty/${id}`),
  updateProfile: (data) => api.put('/faculty/profile', data),
}

export default api
