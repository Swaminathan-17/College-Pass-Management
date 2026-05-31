require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING PDF GENERATION ===\n');

const testPDFGeneration = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and services
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    const { generatePassPDF } = require('./utils/pdfGenerator');
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
      passCode: 'TESTPDF123',
      passType: 'regular',
      destination: 'Test Destination',
      outDate: new Date().toISOString().split('T')[0],
      outTime: '10:00 AM',
      expectedReturnTime: '06:00 PM',
      reason: 'Test reason for PDF generation',
      status: 'FACULTY_APPROVED',
      facultyRemark: 'Test approval remark',
      isEmergency: false,
      assignedFacultyId: faculty,
      studentId: student
    };
    
    console.log('✅ Generating PDF with test data...');
    console.log(`   Student: ${student.userId.name}`);
    console.log(`   Pass Code: ${mockPassRequest.passCode}`);
    console.log(`   Destination: ${mockPassRequest.destination}`);
    
    // Generate PDF
    const pdfPath = await generatePassPDF(mockPassRequest, student, faculty.userId.name);
    console.log(`✅ PDF generated: ${pdfPath}`);
    
    // Check if file exists and get its size
    const absolutePath = path.join(__dirname, '..', pdfPath);
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      console.log(`✅ File size: ${stats.size} bytes`);
      console.log(`✅ File path: ${absolutePath}`);
      
      // Read and analyze PDF structure (basic check)
      const pdfContent = fs.readFileSync(absolutePath, 'utf8');
      const pageCount = (pdfContent.match(/\/Type\s*\/Page[^s]/g) || []).length;
      console.log(`✅ Estimated page count: ${pageCount || 1}`);
      
      if (pageCount > 1) {
        console.log('⚠️  PDF has multiple pages - this is the issue!');
      } else {
        console.log('✅ PDF appears to be single page');
      }
    } else {
      console.log('❌ PDF file not found');
    }
    
    console.log('\n✅ PDF GENERATION TEST COMPLETE');
    console.log('💡 Check the generated PDF file to verify page count');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testPDFGeneration();
