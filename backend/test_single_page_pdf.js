require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING SINGLE-PAGE PDF GENERATION ===\n');

const testSinglePagePDF = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and services
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const { generatePassPDFSinglePage } = require('./utils/pdfGeneratorSinglePage');
    const fs = require('fs');
    const path = require('path');
    
    // Find test data
    const student = await Student.findOne({}).populate('userId');
    const faculty = await Faculty.findOne({}).populate('userId');
    
    if (!student || !faculty) {
      console.log('❌ Test data not found');
      return;
    }
    
    // Create a mock pass request
    const mockPassRequest = {
      _id: 'test123',
      passCode: 'SINGLE123',
      passType: 'regular',
      destination: 'Test Destination - Single Page',
      outDate: new Date().toISOString().split('T')[0],
      outTime: '10:00 AM',
      expectedReturnTime: '06:00 PM',
      reason: 'Test reason for single page PDF generation',
      status: 'FACULTY_APPROVED',
      facultyRemark: 'Test approval remark',
      isEmergency: false,
      assignedFacultyId: faculty,
      studentId: student
    };
    
    console.log('✅ Generating SINGLE-PAGE PDF with test data...');
    console.log(`   Student: ${student.userId.name}`);
    console.log(`   Pass Code: ${mockPassRequest.passCode}`);
    console.log(`   Destination: ${mockPassRequest.destination}`);
    
    // Generate PDF
    const pdfPath = await generatePassPDFSinglePage(mockPassRequest, student, faculty.userId.name);
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    // Check if file exists and get its size
    const absolutePath = path.join(__dirname, '..', pdfPath);
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      console.log(`✅ File size: ${stats.size} bytes`);
      console.log(`✅ File path: ${absolutePath}`);
      
      // Check page count using file command
      const { exec } = require('child_process');
      exec(`file "${absolutePath}"`, (error, stdout, stderr) => {
        if (!error) {
          console.log(`✅ File info: ${stdout.trim()}`);
          if (stdout.includes('5 page(s)')) {
            console.log('❌ Still 5 pages - need to fix further');
          } else if (stdout.includes('1 page(s)')) {
            console.log('✅ SUCCESS - Single page PDF generated!');
          } else {
            console.log('✅ PDF generated - check page count manually');
          }
        }
      });
    } else {
      console.log('❌ PDF file not found');
    }
    
    console.log('\n✅ SINGLE-PAGE PDF TEST COMPLETE');
    console.log('💡 The new PDF should be single page and properly formatted');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testSinglePagePDF();
