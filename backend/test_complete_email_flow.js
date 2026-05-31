require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== COMPLETE EMAIL FLOW TEST ===\n');

const testCompleteEmailFlow = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    // Find test data
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({ isClassIncharge: true }).populate('userId');
    const hod = await Faculty.findOne({ isHOD: true }).populate('userId');
    
    if (!student || !faculty) {
      console.log('❌ Test data not found');
      return;
    }
    
    console.log(`✅ Found student: ${student.userId.name} (${student.userId.email})`);
    console.log(`✅ Found faculty: ${faculty.userId.name} (${faculty.userId.email})`);
    if (hod) {
      console.log(`✅ Found HOD: ${hod.userId.name} (${hod.userId.email})`);
    }
    
    // Test email service functions
    const { sendFacultyNotification, sendStudentPassApproval, sendHodEmergencyNotification, sendParentNotification } = require('./utils/emailService');
    
    console.log('\n1. Testing Faculty Notification:');
    try {
      await sendFacultyNotification(
        faculty.userId.email,
        student.userId.name,
        {
          passType: 'regular',
          reason: 'Test regular pass',
          destination: 'Test destination',
          outDate: '2026-04-22',
          outTime: '10:00 AM',
          expectedReturnTime: '06:00 PM'
        }
      );
      console.log('   ✅ Faculty notification sent');
    } catch (error) {
      console.log('   ❌ Faculty notification failed:', error.message);
    }
    
    console.log('\n2. Testing Student Pass Approval:');
    try {
      await sendStudentPassApproval(
        student.userId.email,
        student.userId.name,
        'TEST123',
        null // No PDF for test
      );
      console.log('   ✅ Student approval notification sent');
    } catch (error) {
      console.log('   ❌ Student approval notification failed:', error.message);
    }
    
    if (hod) {
      console.log('\n3. Testing HOD Emergency Notification:');
      try {
        await sendHodEmergencyNotification(
          hod.userId.email,
          student.userId.name,
          {
            passType: 'emergency',
            reason: 'Test emergency',
            destination: 'Test emergency destination',
            outDate: '2026-04-22',
            outTime: '02:00 PM',
            expectedReturnTime: '08:00 PM'
          }
        );
        console.log('   ✅ HOD emergency notification sent');
      } catch (error) {
        console.log('   ❌ HOD emergency notification failed:', error.message);
      }
    }
    
    if (student.parentEmail) {
      console.log('\n4. Testing Parent Notification:');
      try {
        await sendParentNotification(
          student.parentEmail,
          student.userId.name,
          {
            destination: 'Test destination',
            outDate: '2026-04-22',
            outTime: '10:00 AM',
            expectedReturnTime: '06:00 PM'
          }
        );
        console.log('   ✅ Parent notification sent');
      } catch (error) {
        console.log('   ❌ Parent notification failed:', error.message);
      }
    } else {
      console.log('\n4. Parent Notification: ⚠️  No parent email found for student');
    }
    
    console.log('\n✅ EMAIL FLOW TEST COMPLETE');
    console.log('💡 Check your email inbox (including spam folder) for test emails');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testCompleteEmailFlow();
