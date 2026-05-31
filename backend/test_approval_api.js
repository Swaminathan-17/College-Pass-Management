require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING FACULTY APPROVAL API ===\n');

const testFacultyApprovalAPI = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models and controller
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    // Find a REQUESTED pass to test approval
    const requestedPass = await PassRequest.findOne({ status: 'REQUESTED' })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    if (!requestedPass) {
      console.log('❌ No REQUESTED passes found for testing');
      
      // Create a test pass if none exists
      console.log('🔧 Creating a test pass for approval...');
      const student = await Student.findOne({}).populate('userId');
      const faculty = await Faculty.findOne({ isHOD: false });
      
      if (!student || !faculty) {
        console.log('❌ Cannot create test pass - missing student or faculty');
        return;
      }
      
      const newPass = new PassRequest({
        studentId: student._id,
        assignedFacultyId: faculty._id,
        passType: 'home',
        destination: 'Test Destination',
        outDate: new Date().toISOString().split('T')[0],
        outTime: '10:00 AM',
        expectedReturnTime: '06:00 PM',
        reason: 'Test pass for approval API',
        status: 'REQUESTED',
        isEmergency: false
      });
      
      await newPass.save();
      console.log('✅ Test pass created:', newPass._id);
      
      // Use the new pass for testing
      const testPass = await PassRequest.findById(newPass._id)
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });
      return testPass;
    }
    
    console.log('=== PASS DETAILS ===');
    console.log(`✅ Pass ID: ${requestedPass._id}`);
    console.log(`✅ Student: ${requestedPass.studentId?.userId?.name}`);
    console.log(`✅ Residence: ${requestedPass.studentId?.residenceType}`);
    console.log(`✅ Pass Type: ${requestedPass.passType}`);
    console.log(`✅ Status: ${requestedPass.status}`);
    console.log(`✅ Emergency: ${requestedPass.isEmergency}`);
    
    // Find faculty user for testing
    const faculty = await Faculty.findOne({ isHOD: false }).populate('userId');
    if (!faculty) {
      console.log('❌ No faculty found for testing');
      return;
    }
    
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    console.log('\n=== TESTING FACULTY APPROVAL FUNCTION ===');
    
    try {
      // Simulate the exact faculty approval process
      console.log('🔧 Step 1: Finding pass request...');
      
      const passRequest = await PassRequest.findById(requestedPass._id)
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        })
        .populate('assignedFacultyId');
      
      if (!passRequest) {
        console.log('❌ Pass request not found');
        return;
      }
      
      console.log('✅ Pass request found');
      
      console.log('🔧 Step 2: Checking status...');
      if (passRequest.status !== 'REQUESTED') {
        console.log(`❌ Pass cannot be approved - current status: ${passRequest.status}`);
        return;
      }
      
      console.log('✅ Pass status is REQUESTED - can approve');
      
      console.log('🔧 Step 3: Getting student data...');
      const student = passRequest.studentId;
      console.log(`✅ Student: ${student.userId?.name} (${student.residenceType})`);
      
      console.log('🔧 Step 4: Processing approval logic...');
      
      // Handle different approval workflows based on residence type and pass type
      if (student.residenceType === 'hosteller') {
        if (passRequest.passType === 'emergency') {
          console.log('✅ Emergency pass for hosteller - forwarding to HOD');
          passRequest.status = 'FACULTY_APPROVED';
          passRequest.facultyRemark = 'Approved by faculty - forwarded to HOD';
          await passRequest.save();
          console.log('✅ Saved - waiting for HOD approval');
        } else {
          console.log('✅ Normal pass for hosteller - forwarding to warden');
          passRequest.status = 'FACULTY_APPROVED';
          passRequest.facultyRemark = 'Approved by faculty - forwarded to warden';
          await passRequest.save();
          console.log('✅ Saved - waiting for warden approval');
        }
      } else {
        console.log('✅ Day-scholar pass - generating final approval');
        passRequest.status = 'FACULTY_APPROVED';
        passRequest.facultyRemark = 'Approved by faculty';
        await passRequest.save();
        
        // Generate pass code
        const { randomBytes } = require('crypto');
        passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();
        console.log(`✅ Generated pass code: ${passRequest.passCode}`);
        
        // Generate PDF (if needed)
        try {
          const { generatePassPDFSinglePage } = require('./utils/pdfGeneratorSinglePage');
          const pdfPath = await generatePassPDFSinglePage(passRequest, student, faculty.userId.name);
          passRequest.pdfUrl = pdfPath;
          console.log(`✅ PDF generated: ${pdfPath}`);
        } catch (pdfError) {
          console.log('⚠️  PDF generation failed:', pdfError.message);
        }
        
        await passRequest.save();
        console.log('✅ Final approval completed');
      }
      
      console.log('\n✅ FACULTY APPROVAL SUCCESSFUL');
      console.log(`✅ Final status: ${passRequest.status}`);
      console.log(`✅ Pass code: ${passRequest.passCode || 'Not generated yet'}`);
      console.log(`✅ Remark: ${passRequest.facultyRemark}`);
      
    } catch (error) {
      console.error('❌ Faculty approval failed:', error.message);
      console.error('❌ Full error:', error);
    }
    
    console.log('\n=== VERIFYING RESULT ===');
    
    // Check the final state
    const finalPass = await PassRequest.findById(requestedPass._id)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    console.log(`✅ Final status: ${finalPass.status}`);
    console.log(`✅ Has pass code: ${finalPass.passCode ? 'Yes' : 'No'}`);
    console.log(`✅ Has PDF: ${finalPass.pdfUrl ? 'Yes' : 'No'}`);
    
    console.log('\n✅ APPROVAL API TEST COMPLETE');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testFacultyApprovalAPI();
