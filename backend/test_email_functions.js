require('dotenv').config();

console.log('=== TESTING EMAIL FUNCTIONS ===\n');

// Test the email service functions directly
const testEmailFunctions = async () => {
  try {
    // Import the functions directly
    const fs = require('fs');
    const path = require('path');
    
    // Read and evaluate the email service file
    const emailServicePath = path.join(__dirname, 'utils', 'emailService.js');
    const emailServiceCode = fs.readFileSync(emailServicePath, 'utf8');
    
    // Create a mock nodemailer for testing
    const nodemailer = require('nodemailer');
    
    // Test the actual email service
    const { sendEmail, sendFacultyNotification, sendStudentPassApproval } = require('./utils/emailService');
    
    console.log('1. Testing sendEmail function:');
    await sendEmail(
      process.env.EMAIL_USER,
      'Test Email - College Pass Management',
      'This is a test email to verify the sendEmail function is working correctly.\n\nSent at: ' + new Date().toLocaleString()
    );
    console.log('   ✅ sendEmail function works');
    
    console.log('\n2. Testing sendFacultyNotification function:');
    await sendFacultyNotification(
      process.env.EMAIL_USER,
      'Test Student',
      {
        passType: 'regular',
        reason: 'Test reason for pass',
        destination: 'Test destination',
        outDate: '2026-04-22',
        outTime: '10:00 AM',
        expectedReturnTime: '06:00 PM'
      }
    );
    console.log('   ✅ sendFacultyNotification function works');
    
    console.log('\n3. Testing sendStudentPassApproval function:');
    await sendStudentPassApproval(
      process.env.EMAIL_USER,
      'Test Student',
      'TEST123',
      null // No PDF attachment for test
    );
    console.log('   ✅ sendStudentPassApproval function works');
    
    console.log('\n✅ ALL EMAIL FUNCTIONS WORKING CORRECTLY');
    
  } catch (error) {
    console.log('❌ Email function test failed:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }
};

// Test actual pass request email notifications
const testPassRequestEmails = async () => {
  try {
    console.log('\n4. Testing Pass Request Email Flow:');
    
    // Check if we can create a test scenario
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management');
    
    // Find test users
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({}).populate('userId');
    
    if (student && faculty) {
      console.log(`   Found student: ${student.userId.name}`);
      console.log(`   Found faculty: ${faculty.userId.name}`);
      
      const { sendFacultyNotification } = require('./utils/emailService');
      
      await sendFacultyNotification(
        faculty.userId.email,
        student.userId.name,
        {
          passType: 'emergency',
          reason: 'Medical emergency',
          destination: 'Hospital',
          outDate: '2026-04-22',
          outTime: '02:00 PM',
          expectedReturnTime: '08:00 PM'
        }
      );
      
      console.log('   ✅ Pass request email sent to faculty');
    } else {
      console.log('   ⚠️  No test users found in database');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.log('❌ Pass request email test failed:');
    console.log('   Error:', error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  await testEmailFunctions();
  await testPassRequestEmails();
  process.exit(0);
};

// Import mongoose for the second test
const mongoose = require('mongoose');

runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
