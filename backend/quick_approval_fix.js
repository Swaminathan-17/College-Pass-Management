require('dotenv').config();
const mongoose = require('mongoose');

console.log('🚀 QUICK APPROVAL FIX 🚀\n');

const quickFix = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    
    const Student = require('./models/Student');
    const Faculty = require('./models/Faculty');
    const PassRequest = require('./models/PassRequest');
    
    // Create test pass
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({ isHOD: false });
    
    if (!student || !faculty) {
      console.log('❌ Missing data');
      return;
    }
    
    const testPass = new PassRequest({
      studentId: student._id,
      assignedFacultyId: faculty._id,
      passType: 'home',
      destination: 'Test',
      outDate: new Date().toISOString().split('T')[0],
      outTime: '10:00 AM',
      expectedReturnTime: '06:00 PM',
      reason: 'Test',
      status: 'REQUESTED',
      isEmergency: false
    });
    
    await testPass.save();
    console.log('✅ Test pass created:', testPass._id);
    
    // Test approval
    const { facultyApprove } = require('./controllers/passController');
    
    const mockReq = {
      params: { id: testPass._id },
      body: { remark: 'Test approval' },
      user: { id: faculty.userId._id }
    };
    
    let response = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          response = { status: code, data };
          console.log(`✅ Response: ${code}`, data);
        }
      }),
      json: (data) => {
        response = { status: 200, data };
        console.log(`✅ Response: 200`, data);
      }
    };
    
    console.log('🔧 Testing approval...');
    await facultyApprove(mockReq, mockRes);
    
    if (response && response.status === 200) {
      console.log('✅ APPROVAL WORKS! The issue is in frontend-backend communication');
    } else {
      console.log('❌ APPROVAL FAILED:', response);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
};

quickFix();
