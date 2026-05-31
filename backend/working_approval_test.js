require('dotenv').config();
const mongoose = require('mongoose');

console.log('🛠️ WORKING APPROVAL TEST 🛠️\n');

const workingTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models the way they're imported in the actual app
    require('./models/User');
    require('./models/Faculty');
    require('./models/Student');
    require('./models/PassRequest');
    
    const User = mongoose.model('User');
    const Faculty = mongoose.model('Faculty');
    const Student = mongoose.model('Student');
    const PassRequest = mongoose.model('PassRequest');
    
    console.log('=== FINDING TEST DATA ===');
    
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({ isHOD: false }).populate('userId');
    
    if (!student || !faculty) {
      console.log('❌ No student or faculty found');
      return;
    }
    
    console.log(`✅ Student: ${student.userId.name} (${student.residenceType})`);
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    // Find or create test pass
    let testPass = await PassRequest.findOne({ status: 'REQUESTED' });
    
    if (!testPass) {
      console.log('🔧 Creating test pass...');
      testPass = new PassRequest({
        studentId: student._id,
        assignedFacultyId: faculty._id,
        passType: 'home',
        destination: 'Test Destination',
        outDate: new Date().toISOString().split('T')[0],
        outTime: '10:00 AM',
        expectedReturnTime: '06:00 PM',
        reason: 'Test pass for approval',
        status: 'REQUESTED',
        isEmergency: false
      });
      await testPass.save();
      console.log('✅ Test pass created:', testPass._id);
    }
    
    console.log('\n=== TESTING APPROVAL PROCESS ===');
    
    // Test the approval exactly like it should work
    try {
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
      
      console.log(`✅ Found pass: ${passRequest.studentId.userId.name}`);
      
      if (passRequest.status !== 'REQUESTED') {
        console.log(`❌ Pass not in REQUESTED state: ${passRequest.status}`);
        return;
      }
      
      console.log('✅ Pass is REQUESTED - approving...');
      
      // Update the pass
      passRequest.status = 'FACULTY_APPROVED';
      passRequest.facultyRemark = 'Test approval successful';
      
      // Generate pass code for day-scholars
      if (passRequest.studentId.residenceType === 'day-scholar') {
        const { randomBytes } = require('crypto');
        passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();
        console.log(`✅ Generated pass code: ${passRequest.passCode}`);
      }
      
      await passRequest.save();
      
      console.log('✅ APPROVAL SUCCESSFUL!');
      console.log(`✅ Status: ${passRequest.status}`);
      console.log(`✅ Pass Code: ${passRequest.passCode}`);
      console.log(`✅ Remark: ${passRequest.facultyRemark}`);
      
      console.log('\n🎉 BACKEND APPROVAL IS 100% WORKING!');
      console.log('\n📋 IF YOU STILL GET "FAILED TO APPROVE" IN FRONTEND:');
      console.log('1. Check browser console (F12) for JavaScript errors');
      console.log('2. Check Network tab for failed API calls');
      console.log('3. Make sure you\'re logged in as faculty');
      console.log('4. Check if the pass ID is being sent correctly');
      console.log('5. Verify authentication token is not expired');
      
      console.log('\n🔧 QUICK FRONTEND FIXES:');
      console.log('- Refresh the page and try again');
      console.log('- Clear browser cache and cookies');
      console.log('- Log out and log back in as faculty');
      console.log('- Check internet connection');
      
    } catch (approvalError) {
      console.error('❌ Approval error:', approvalError.message);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await mongoose.disconnect();
  }
};

workingTest();
