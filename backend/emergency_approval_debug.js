require('dotenv').config();
const mongoose = require('mongoose');

console.log('🚨 EMERGENCY APPROVAL DEBUG 🚨\n');

const emergencyDebug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    console.log('=== STEP 1: CHECKING ALL PASSES ===');
    
    const allPasses = await PassRequest.find({})
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedFacultyId')
      .populate('assignedHodId');
    
    console.log(`Total passes: ${allPasses.length}`);
    
    const requestedPasses = allPasses.filter(p => p.status === 'REQUESTED');
    console.log(`REQUESTED passes: ${requestedPasses.length}`);
    
    if (requestedPasses.length === 0) {
      console.log('❌ NO REQUESTED PASSES FOUND - Creating one for testing...');
      
      const student = await Student.findOne({}).populate('userId');
      const faculty = await Faculty.findOne({ isHOD: false });
      
      if (!student || !faculty) {
        console.log('❌ Cannot create test - missing data');
        return;
      }
      
      const testPass = new PassRequest({
        studentId: student._id,
        assignedFacultyId: faculty._id,
        passType: 'home',
        destination: 'Test Destination',
        outDate: new Date().toISOString().split('T')[0],
        outTime: '10:00 AM',
        expectedReturnTime: '06:00 PM',
        reason: 'Emergency test pass',
        status: 'REQUESTED',
        isEmergency: false
      });
      
      await testPass.save();
      console.log('✅ Test pass created:', testPass._id);
      requestedPasses.push(testPass);
    }
    
    console.log('\n=== STEP 2: TESTING APPROVAL FUNCTION DIRECTLY ===');
    
    const testPass = requestedPasses[0];
    console.log(`Testing pass: ${testPass._id}`);
    console.log(`Student: ${testPass.studentId?.userId?.name}`);
    console.log(`Status: ${testPass.status}`);
    
    try {
      console.log('\n🔧 Calling facultyApprove function directly...');
      
      // Simulate the exact faculty approval process
      const passRequest = await PassRequest.findById(testPass._id)
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        })
        .populate('assignedFacultyId');
      
      if (!passRequest) {
        console.log('❌ Pass not found');
        return;
      }
      
      console.log('✅ Pass found in database');
      
      if (passRequest.status !== 'REQUESTED') {
        console.log(`❌ Wrong status: ${passRequest.status}`);
        return;
      }
      
      console.log('✅ Status is REQUESTED - can approve');
      
      // Get student data
      const student = passRequest.studentId;
      console.log(`✅ Student data: ${student.userId?.name} (${student.residenceType})`);
      
      // Update status
      passRequest.status = 'FACULTY_APPROVED';
      passRequest.facultyRemark = 'Emergency test approval';
      
      await passRequest.save();
      console.log('✅ Status updated to FACULTY_APPROVED');
      
      // Generate pass code for day-scholars
      if (student.residenceType === 'day-scholar') {
        const { randomBytes } = require('crypto');
        passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();
        await passRequest.save();
        console.log(`✅ Pass code generated: ${passRequest.passCode}`);
      }
      
      console.log('✅ APPROVAL SUCCESSFUL!');
      
    } catch (error) {
      console.error('❌ APPROVAL FAILED:', error.message);
      console.error('❌ Full error:', error);
    }
    
    console.log('\n=== STEP 3: VERIFYING RESULT ===');
    
    const finalPass = await PassRequest.findById(testPass._id);
    console.log(`Final status: ${finalPass.status}`);
    console.log(`Has pass code: ${finalPass.passCode ? 'Yes' : 'No'}`);
    
    console.log('\n=== STEP 4: CHECKING ROUTES ===');
    
    // Check if routes are properly set up
    try {
      const express = require('express');
      const app = express();
      const { facultyApprove } = require('./controllers/passController');
      
      console.log('✅ facultyApprove function imported successfully');
      console.log('✅ Function type:', typeof facultyApprove);
      
    } catch (routeError) {
      console.error('❌ Route import error:', routeError.message);
    }
    
    console.log('\n🚨 EMERGENCY DEBUG COMPLETE 🚨');
    console.log('💡 If approval works here, the issue is in frontend-backend communication');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ DEBUG FAILED:', error);
    await mongoose.disconnect();
  }
};

emergencyDebug();
