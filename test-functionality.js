const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
  student: {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    studentDetails: {
      rollNo: 'STU001',
      department: 'Computer Science',
      year: 3,
      phone: '1234567890',
      parentPhone: '0987654321',
      parentEmail: 'parent@test.com'
    }
  },
  faculty: {
    name: 'Test Faculty',
    email: 'faculty@test.com',
    password: 'password123',
    role: 'faculty'
  },
  warden: {
    name: 'Test Warden',
    email: 'warden@test.com',
    password: 'password123',
    role: 'warden'
  },
  security: {
    name: 'Test Security',
    email: 'security@test.com',
    password: 'password123',
    role: 'security'
  }
};

let tokens = {};

async function registerUser(userData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    console.log(`✓ Registered ${userData.role}: ${userData.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message === 'User already exists') {
      console.log(`- User ${userData.email} already exists, trying login...`);
      return await loginUser(userData.email, userData.password);
    }
    console.error(`✗ Failed to register ${userData.role}:`, error.response?.data || error.message);
    return null;
  }
}

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    console.log(`✓ Logged in: ${email}`);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to login ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testPassRequest(token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/pass/request`,
      {
        passType: 'home',
        reason: 'Test pass request',
        destination: 'Home',
        outDate: '2026-03-20',
        outTime: '10:00',
        expectedReturnTime: '18:00'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Pass request created successfully');
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create pass request:', error.response?.data || error.message);
    return null;
  }
}

async function testPassHistory(token) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/pass/history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Pass history retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('✗ Failed to get pass history:', error.response?.data || error.message);
    return null;
  }
}

async function testAdminAnalytics(token) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/analytics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Admin analytics retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('✗ Failed to get admin analytics:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting functionality tests...\n');

  // Register and login all test users
  for (const [role, userData] of Object.entries(testUsers)) {
    const result = await registerUser(userData);
    if (result) {
      tokens[role] = result.token;
    }
  }

  console.log('\n📝 Testing student functionality...');
  if (tokens.student) {
    await testPassRequest(tokens.student);
    await testPassHistory(tokens.student);
  }

  console.log('\n📊 Testing admin functionality...');
  if (tokens.admin) {
    await testAdminAnalytics(tokens.admin);
  }

  console.log('\n✅ All tests completed!');
  console.log('\n🔑 Test User Credentials:');
  console.log('Student: student@test.com / password123');
  console.log('Faculty: faculty@test.com / password123');
  console.log('Warden: warden@test.com / password123');
  console.log('Security: security@test.com / password123');
  console.log('Admin: admin@test.com / password123');
}

// Check if servers are running
async function checkServers() {
  try {
    // Check backend by trying to access a protected endpoint (should return 401)
    await axios.get('http://localhost:5000/api/pass/history');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Backend server is running and responding');
    } else {
      console.log('✗ Backend server is not responding correctly');
      return false;
    }
  }

  console.log('✓ Backend server is ready for testing');
  return true;
}

async function main() {
  const serversRunning = await checkServers();
  if (serversRunning) {
    await runTests();
  } else {
    console.log('Please make sure both backend (port 5000) and frontend (port 5173) servers are running');
  }
}

main().catch(console.error);
