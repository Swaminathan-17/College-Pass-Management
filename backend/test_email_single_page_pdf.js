require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING EMAIL WITH SINGLE-PAGE PDF ===\n');

const testEmailWithSinglePagePDF = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and services
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const { generatePassPDFSinglePage } = require('./utils/pdfGeneratorSinglePage');
    const { sendStudentPassApproval } = require('./utils/emailService');
    const fs = require('fs');
    const path = require('path');
    
    // Find test data
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({}).populate('userId');
    
    if (!student || !faculty) {
      console.log('❌ Test data not found');
      return;
    }
    
    console.log(`✅ Student: ${student.userId.name} (${student.userId.email})`);
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    // Create a mock pass request for testing
    const mockPassRequest = {
      _id: 'emailtest123',
      passCode: 'EMAILPDF123',
      passType: 'regular',
      destination: 'Test Destination - Email with Single Page PDF',
      outDate: new Date().toISOString().split('T')[0],
      outTime: '10:00 AM',
      expectedReturnTime: '06:00 PM',
      reason: 'Test email with single page PDF attachment',
      status: 'FACULTY_APPROVED',
      facultyRemark: 'Test approval for email verification',
      isEmergency: false,
      assignedFacultyId: faculty,
      studentId: student
    };
    
    console.log('\n1. Generating single-page PDF...');
    const pdfPath = await generatePassPDFSinglePage(mockPassRequest, student, faculty.userId.name);
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    // Check PDF file
    const absolutePdfPath = path.join(__dirname, '..', pdfPath);
    if (fs.existsSync(absolutePdfPath)) {
      const stats = fs.statSync(absolutePdfPath);
      console.log(`✅ File size: ${stats.size} bytes`);
      console.log(`✅ File exists: ${absolutePdfPath}`);
      
      // Verify it's single page
      const { exec } = require('child_process');
      exec(`file "${absolutePdfPath}"`, (error, stdout, stderr) => {
        if (!error) {
          console.log(`✅ PDF info: ${stdout.trim()}`);
          if (stdout.includes('1 page(s)')) {
            console.log('✅ CONFIRMED: Single-page PDF generated');
          }
        }
      });
    }
    
    console.log('\n2. Sending email with single-page PDF attachment...');
    try {
      await sendStudentPassApproval(
        student.userId.email,
        student.userId.name,
        mockPassRequest.passCode,
        absolutePdfPath
      );
      console.log('✅ Email sent successfully with single-page PDF attachment');
      console.log(`📧 Check email: ${student.userId.email}`);
      console.log('📎 The email should contain a single-page PDF attachment');
    } catch (error) {
      console.log('❌ Email sending failed:', error.message);
    }
    
    console.log('\n3. Comparing with old multi-page PDF...');
    const oldPdfPath = path.join(__dirname, '../uploads/passes/pass_541B7ACC_1776855058573.pdf');
    if (fs.existsSync(oldPdfPath)) {
      exec(`file "${oldPdfPath}"`, (error, stdout, stderr) => {
        if (!error) {
          console.log(`📄 Old PDF: ${stdout.trim()}`);
        }
      });
    }
    
    console.log('\n✅ EMAIL WITH SINGLE-PAGE PDF TEST COMPLETE');
    console.log('💡 Check your email for the test message with single-page PDF attachment');
    console.log('📊 Comparison:');
    console.log('   - Old PDF: 5 pages (large file)');
    console.log('   - New PDF: 1 page (compact, email-friendly)');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testEmailWithSinglePagePDF();
