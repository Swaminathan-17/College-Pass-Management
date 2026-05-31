require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING REAL PASS APPROVAL EMAIL SYSTEM ===\n');

const testRealPassApproval = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and services
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    const { sendStudentPassApproval } = require('./utils/emailService');
    
    // Find a pending pass request to test with
    const pendingPass = await PassRequest.findOne({ status: 'REQUESTED' })
      .populate('studentId')
      .populate('assignedFacultyId');
    
    if (!pendingPass) {
      console.log('⚠️  No pending pass requests found. Creating a test scenario...');
      
      // Create a test scenario
      const student = await Student.findOne({}).populate('userId');
      const faculty = await Faculty.findOne({}).populate('userId');
      
      if (!student || !faculty) {
        console.log('❌ No student or faculty found for test');
        return;
      }
      
      console.log(`✅ Using student: ${student.userId.name}`);
      console.log(`✅ Using faculty: ${faculty.userId.name}`);
      
      // Simulate faculty approval process
      const testPassCode = 'REAL' + Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`✅ Generated test pass code: ${testPassCode}`);
      
      // Test email with real data
      console.log('\n1. Testing email with real pass data:');
      try {
        await sendStudentPassApproval(
          student.userId.email,
          student.userId.name,
          testPassCode,
          null // No PDF for this test
        );
        console.log('   ✅ Email sent with real pass code:', testPassCode);
      } catch (error) {
        console.log('   ❌ Email failed:', error.message);
      }
      
    } else {
      console.log(`✅ Found pending pass request: ${pendingPass._id}`);
      console.log(`   Student: ${pendingPass.studentId?.userId?.name}`);
      console.log(`   Destination: ${pendingPass.destination}`);
      console.log(`   Status: ${pendingPass.status}`);
      
      // Simulate approval
      const testPassCode = 'REAL' + Math.random().toString(36).substring(2, 8).toUpperCase();
      pendingPass.status = 'FACULTY_APPROVED';
      pendingPass.passCode = testPassCode;
      pendingPass.facultyRemark = 'Test approval for email verification';
      
      console.log(`✅ Simulated approval with pass code: ${testPassCode}`);
      
      // Test email with real pass data
      console.log('\n1. Testing email with actual pass request data:');
      try {
        await sendStudentPassApproval(
          pendingPass.studentId.userId.email,
          pendingPass.studentId.userId.name,
          testPassCode,
          null // No PDF for this test
        );
        console.log('   ✅ Email sent successfully with real pass data');
        console.log('   📧 Check email for:', pendingPass.studentId.userId.email);
      } catch (error) {
        console.log('   ❌ Email failed:', error.message);
      }
    }
    
    // Test PDF attachment path resolution
    console.log('\n2. Testing PDF path resolution:');
    const path = require('path');
    const testPdfPath = '/uploads/passes/test.pdf';
    const absolutePath = path.join(__dirname, '..', testPdfPath);
    console.log(`   Relative path: ${testPdfPath}`);
    console.log(`   Absolute path: ${absolutePath}`);
    console.log(`   Path exists: ${require('fs').existsSync(absolutePath) ? '✅ Yes' : '❌ No (expected for test)'}`);
    
    console.log('\n✅ REAL PASS APPROVAL EMAIL TEST COMPLETE');
    console.log('💡 Check email inbox for the test email with actual pass details');
    console.log('📧 The email should contain the real pass code, not TEST123');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testRealPassApproval();
