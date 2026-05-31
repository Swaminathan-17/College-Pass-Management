const mongoose = require('mongoose');
const { generatePassPDF } = require('./utils/pdfGenerator');
require('dotenv').config();

// Test data
const testPassRequest = {
  _id: 'test123',
  passCode: '70088E55',
  passType: 'home',
  destination: 'Home',
  reason: 'Weekend visit',
  outDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  outTime: '10:00',
  expectedReturnTime: '18:00',
  facultyRemark: 'Approved for weekend'
};

const testStudent = {
  name: 'Test Student',
  rollNo: '21BCE1234',
  department: 'Computer Science Engineering',
  year: 3,
  class: 'CSE-C',
  residenceType: 'day-scholar',
  parentEmail: 'parent@example.com'
};

const facultyName = 'Lalitha Faculty';

async function testDynamicPDF() {
  try {
    console.log('🔄 Testing dynamic PDF generation...');
    
    // Generate PDF using the updated function
    const pdfPath = await generatePassPDF(testPassRequest, testStudent, facultyName);
    
    console.log('✅ PDF generated successfully!');
    console.log('📁 Path:', pdfPath);
    console.log('🎨 This PDF should have the new design with:');
    console.log('   - Light background');
    console.log('   - Centered SCSVMV UNIVERSITY text');
    console.log('   - Orange PASS CODE block');
    console.log('   - Normal text colors');
    console.log('   - Single page format');
    
    // Copy to uploads folder with the name the browser is looking for
    const fs = require('fs');
    const path = require('path');
    const targetPath = path.join(__dirname, 'uploads/passes/pass_70088E55_1774369169524.pdf');
    
    fs.copyFileSync(pdfPath, targetPath);
    console.log('📋 PDF copied to uploads folder for browser access');
    console.log('🌐 Browser can now access: http://localhost:5000/uploads/passes/pass_70088E55_1774369169524.pdf');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  }
}

testDynamicPDF();
