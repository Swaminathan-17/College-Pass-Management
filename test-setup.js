// Test script to verify the College Pass Management System
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testSystem() {
  console.log('🧪 Testing College Pass Management System...\n');

  try {
    // Test 1: Register a student
    console.log('1️⃣ Registering a student...');
    const studentResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      studentDetails: {
        rollNo: 'CS2023001',
        department: 'Computer Science',
        year: 3,
        phone: '1234567890',
        parentPhone: '0987654321',
        parentEmail: 'parent@test.com'
      }
    });
    console.log('✅ Student registered successfully');
    const studentToken = studentResponse.data.token;

    // Test 2: Register a faculty
    console.log('\n2️⃣ Registering a faculty member...');
    const facultyResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty'
    });
    console.log('✅ Faculty registered successfully');
    const facultyToken = facultyResponse.data.token;

    // Test 3: Student login
    console.log('\n3️⃣ Testing student login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student@test.com',
      password: 'password123'
    });
    console.log('✅ Student login successful');

    // Test 4: Create pass request
    console.log('\n4️⃣ Creating pass request...');
    const passResponse = await axios.post(`${API_BASE}/pass/request`, {
      passType: 'home',
      reason: 'Going home for weekend',
      destination: 'Home City',
      outDate: '2024-01-20',
      outTime: '10:00',
      expectedReturnTime: '18:00'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Pass request created successfully');
    const passId = passResponse.data._id;

    // Test 5: Faculty approve pass
    console.log('\n5️⃣ Faculty approving pass...');
    await axios.put(`${API_BASE}/pass/faculty-approve/${passId}`, {
      remark: 'Approved for weekend leave'
    }, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    console.log('✅ Pass approved by faculty');

    // Test 6: Get pass history
    console.log('\n6️⃣ Getting pass history...');
    const historyResponse = await axios.get(`${API_BASE}/pass/history`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Pass history retrieved');
    console.log(`📊 Total passes: ${historyResponse.data.length}`);

    console.log('\n🎉 All tests passed! System is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5173/ in your browser');
    console.log('2. Register users with different roles');
    console.log('3. Test the complete workflow');
    console.log('4. Configure email settings in .env for email notifications');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if MongoDB is available
testSystem().catch(console.error);
