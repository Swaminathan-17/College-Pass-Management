const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

console.log('=== EMAIL CONFIGURATION TEST ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
console.log('   NODE_ENV:', process.env.NODE_ENV);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n❌ EMAIL CONFIGURATION INCOMPLETE');
  console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
  process.exit(1);
}

// Test email service
const nodemailer = require('nodemailer');

const testEmailService = async () => {
  try {
    console.log('\n2. Testing Email Service:');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('   ✅ Transporter created');
    
    // Verify connection
    await transporter.verify();
    console.log('   ✅ SMTP connection verified');
    
    // Test sending email
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Test Email - College Pass Management',
      text: 'This is a test email to verify the email service is working correctly.\n\nSent at: ' + new Date().toLocaleString()
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('   ✅ Test email sent successfully');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    
  } catch (error) {
    console.log('   ❌ Email service test failed');
    console.log('   Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('   💡 Possible fix: Check Gmail credentials or enable "Less secure apps"');
      console.log('   💡 Or use an App Password if 2FA is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('   💡 Possible fix: Check internet connection');
    }
  }
};

// Test email service functions
const testEmailFunctions = async () => {
  try {
    console.log('\n3. Testing Email Service Functions:');
    
    const { sendEmail, sendFacultyNotification, sendStudentPassApproval } = require('./utils/emailService');
    
    // Test basic sendEmail function
    await sendEmail(
      process.env.EMAIL_USER,
      'Test Basic Email',
      'This is a test of the basic sendEmail function'
    );
    console.log('   ✅ Basic sendEmail function works');
    
    // Test faculty notification
    await sendFacultyNotification(
      process.env.EMAIL_USER,
      'Test Student',
      {
        passType: 'regular',
        reason: 'Test reason',
        destination: 'Test destination',
        outDate: '2026-04-22',
        outTime: '10:00',
        expectedReturnTime: '18:00'
      }
    );
    console.log('   ✅ Faculty notification function works');
    
    console.log('\n✅ ALL EMAIL TESTS PASSED');
    
  } catch (error) {
    console.log('   ❌ Email function test failed');
    console.log('   Error:', error.message);
  }
};

// Run tests
const runTests = async () => {
  await testEmailService();
  await testEmailFunctions();
  process.exit(0);
};

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
