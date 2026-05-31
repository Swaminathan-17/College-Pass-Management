require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING FACULTY APPROVAL EMAIL ===\n');

const testFacultyApprovalEmail = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and services
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    const { sendStudentPassApproval, sendParentNotification } = require('./utils/emailService');
    
    // Find test data
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({}).populate('userId');
    
    if (!student || !faculty) {
      console.log('❌ Test data not found');
      return;
    }
    
    console.log(`✅ Student: ${student.userId.name} (${student.userId.email})`);
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    // Test email functions directly
    console.log('\n1. Testing sendStudentPassApproval function:');
    try {
      await sendStudentPassApproval(
        student.userId.email,
        student.userId.name,
        'TEST123',
        null // No PDF for test
      );
      console.log('   ✅ Student approval email sent successfully');
    } catch (error) {
      console.log('   ❌ Student approval email failed:', error.message);
    }
    
    if (student.parentEmail) {
      console.log('\n2. Testing sendParentNotification function:');
      try {
        await sendParentNotification(
          student.parentEmail,
          student.userId.name,
          {
            destination: 'Test Destination',
            outDate: '2026-04-22',
            outTime: '10:00 AM',
            expectedReturnTime: '06:00 PM'
          }
        );
        console.log('   ✅ Parent notification email sent successfully');
      } catch (error) {
        console.log('   ❌ Parent notification email failed:', error.message);
      }
    } else {
      console.log('\n2. Parent Notification: ⚠️  No parent email found for student');
    }
    
    // Check existing pass requests and their status
    console.log('\n3. Checking existing pass requests:');
    const passRequests = await PassRequest.find({})
      .populate('studentId')
      .populate('assignedFacultyId');
    
    console.log(`   Found ${passRequests.length} pass requests:`);
    passRequests.forEach((pass, index) => {
      console.log(`   ${index + 1}. Student: ${pass.studentId?.userId?.name} | Status: ${pass.status} | Pass Code: ${pass.passCode || 'Not assigned'}`);
    });
    
    console.log('\n✅ EMAIL TEST COMPLETE');
    console.log('💡 Check email inboxes (including spam folders) for test emails');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testFacultyApprovalEmail();
