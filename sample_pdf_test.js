const { generatePassPDF } = require('./backend/utils/pdfGenerator');

// Sample test data
const samplePassRequest = {
  passCode: '7008BE55',
  passType: 'outpass',
  reason: 'Going home for weekend',
  outDate: new Date(),
  outTime: '04:00 PM',
  expectedReturnTime: '06:00 PM',
  destination: 'Home',
  facultyRemark: 'Approved for weekend leave'
};

const sampleStudent = {
  userId: '507f1f77bcf86cd799439011', // Mock user ID
  rollNo: '21BCE1234',
  department: 'Computer Science Engineering',
  year: 3,
  class: 'CSE-C',
  residenceType: 'day-scholar'
};

const sampleFacultyName = 'Lalitha Faculty';

// Test the PDF generation
async function testPDFGeneration() {
  try {
    console.log('Generating sample PDF with test data...');
    const pdfPath = await generatePassPDF(samplePassRequest, sampleStudent, sampleFacultyName);
    console.log('Sample PDF generated at:', pdfPath);
    console.log('\nSample data used:');
    console.log('Pass Code:', samplePassRequest.passCode);
    console.log('Student Name: Test Student');
    console.log('Roll No:', sampleStudent.rollNo);
    console.log('Department:', sampleStudent.department);
    console.log('Faculty:', sampleFacultyName);
    console.log('\nExpected improvements:');
    console.log('✅ Single page layout');
    console.log('✅ College name center-aligned');
    console.log('✅ Pass code centered in yellow box');
    console.log('✅ Modern color scheme');
    console.log('✅ Compact, professional design');
  } catch (error) {
    console.error('Error generating sample PDF:', error);
  }
}

testPDFGeneration();
