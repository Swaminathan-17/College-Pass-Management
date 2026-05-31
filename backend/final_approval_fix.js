require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔧 FINAL APPROVAL FIX 🔧\n');

const finalFix = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models properly
    const User = mongoose.model('User');
    const Faculty = mongoose.model('Faculty');
    const Student = mongoose.model('Student');
    const PassRequest = mongoose.model('PassRequest');
    
    console.log('=== CREATING TEST PASS ===');
    
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({ isHOD: false });
    
    if (!student || !faculty) {
      console.log('❌ Missing student or faculty');
      return;
    }
    
    console.log(`✅ Student: ${student.userId.name}`);
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    // Check for existing REQUESTED pass
    let testPass = await PassRequest.findOne({ status: 'REQUESTED' });
    
    if (!testPass) {
      console.log('🔧 Creating new test pass...');
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
    } else {
      console.log('✅ Using existing REQUESTED pass:', testPass._id);
    }
    
    console.log('\n=== TESTING APPROVAL ===');
    
    // Test direct database update first
    console.log('🔧 Step 1: Direct database update...');
    testPass.status = 'FACULTY_APPROVED';
    testPass.facultyRemark = 'Direct database test';
    await testPass.save();
    console.log('✅ Direct update successful');
    
    // Reset for API test
    testPass.status = 'REQUESTED';
    await testPass.save();
    console.log('✅ Reset to REQUESTED for API test');
    
    // Test API function
    console.log('🔧 Step 2: Testing API function...');
    
    try {
      const { facultyApprove } = require('./controllers/passController');
      
      const mockReq = {
        params: { id: testPass._id.toString() },
        body: { remark: 'API test approval' },
        user: { id: faculty.userId._id.toString() }
      };
      
      let apiResponse = null;
      let apiStatus = null;
      
      const mockRes = {
        status: (code) => {
          apiStatus = code;
          return {
            json: (data) => {
              apiResponse = data;
              console.log(`✅ API Response: ${code}`, data?.message || data);
            }
          };
        },
        json: (data) => {
          apiStatus = 200;
          apiResponse = data;
          console.log(`✅ API Response: 200`, data?.message || data);
        }
      };
      
      await facultyApprove(mockReq, mockRes);
      
      if (apiStatus === 200) {
        console.log('✅ API APPROVAL SUCCESSFUL!');
        
        // Verify final state
        const finalPass = await PassRequest.findById(testPass._id);
        console.log(`✅ Final status: ${finalPass.status}`);
        console.log(`✅ Pass code: ${finalPass.passCode || 'Generated for day-scholar'}`);
        
        console.log('\n🎉 APPROVAL SYSTEM IS WORKING!');
        console.log('💡 The issue might be:');
        console.log('   1. Frontend not sending correct request format');
        console.log('   2. Authentication token issues');
        console.log('   3. Network connectivity problems');
        console.log('   4. Frontend JavaScript errors');
        
      } else {
        console.log('❌ API APPROVAL FAILED');
        console.log(`   Status: ${apiStatus}`);
        console.log(`   Error: ${apiResponse?.message || 'Unknown error'}`);
        
        // Provide specific fix based on error
        if (apiResponse?.message?.includes('not found')) {
          console.log('🔧 FIX: Check if pass ID is being sent correctly from frontend');
        }
        if (apiResponse?.message?.includes('stage')) {
          console.log('🔧 FIX: Check pass status before approving');
        }
        if (apiResponse?.message?.includes('unauthorized')) {
          console.log('🔧 FIX: Check authentication token in frontend');
        }
      }
      
    } catch (apiError) {
      console.error('❌ API Function Error:', apiError.message);
      
      if (apiError.message.includes('User')) {
        console.log('🔧 FIX: Model import issue - restarting server might help');
      }
    }
    
    console.log('\n=== FRONTEND DEBUGGING TIPS ===');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Check Network tab for failed API requests');
    console.log('3. Verify authentication token is being sent');
    console.log('4. Check if pass ID is correct in the request');
    console.log('5. Ensure faculty user is logged in');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ FINAL FIX ERROR:', error.message);
    await mongoose.disconnect();
  }
};

finalFix();
