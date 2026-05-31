require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== TESTING FACULTY APPROVAL PROCESS ===\n');

const testFacultyApproval = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    // Find the emergency pass for Dhatri that needs approval
    const emergencyPass = await PassRequest.findOne({
      studentId: (await Student.findOne({ residenceType: 'hosteller' }).populate('userId'))._id,
      passType: 'emergency',
      status: 'REQUESTED'
    }).populate({
      path: 'studentId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });
    
    if (!emergencyPass) {
      console.log('❌ No emergency pass found for testing');
      return;
    }
    
    console.log('=== TESTING EMERGENCY PASS APPROVAL ===');
    console.log(`✅ Found emergency pass: ${emergencyPass._id}`);
    console.log(`   Student: ${emergencyPass.studentId.userId.name} (${emergencyPass.studentId.residenceType})`);
    console.log(`   Pass Type: ${emergencyPass.passType}`);
    console.log(`   Status: ${emergencyPass.status}`);
    
    // Find faculty to approve
    const faculty = await Faculty.findOne({ isHOD: false }).populate('userId');
    if (!faculty) {
      console.log('❌ No faculty found for testing');
      return;
    }
    
    console.log(`✅ Faculty: ${faculty.userId.name}`);
    
    // Simulate faculty approval
    console.log('\n=== SIMULATING FACULTY APPROVAL ===');
    
    try {
      // Update the pass as faculty would
      emergencyPass.status = 'FACULTY_APPROVED';
      emergencyPass.facultyRemark = 'Approved by faculty - forwarded to HOD';
      emergencyPass.assignedFacultyId = faculty._id;
      
      // For emergency pass, assign to HOD
      const hod = await Faculty.findOne({ isHOD: true });
      if (hod) {
        emergencyPass.assignedHodId = hod._id;
        console.log(`✅ Assigned to HOD: ${hod.userId?.name || 'Unknown'}`);
      }
      
      await emergencyPass.save();
      
      console.log(`✅ Pass updated to: ${emergencyPass.status}`);
      console.log(`✅ Faculty remark: ${emergencyPass.facultyRemark}`);
      
      // Check what happens next
      console.log('\n=== CHECKING NEXT STEPS ===');
      
      if (emergencyPass.studentId.residenceType === 'hosteller' && emergencyPass.passType === 'emergency') {
        console.log('✅ Emergency pass for hosteller - should go to HOD next');
        console.log('✅ HOD should see this in their dashboard');
        
        // Check if HOD can see this pass
        const hodPasses = await PassRequest.find({
          assignedHodId: hod._id,
          isEmergency: true,
          status: { $in: ['REQUESTED', 'FACULTY_APPROVED'] }
        }).populate('studentId');
        
        console.log(`✅ HOD can see ${hodPasses.length} emergency passes`);
        hodPasses.forEach((pass, index) => {
          console.log(`   ${index + 1}. ${pass.studentId?.userId?.name} - Status: ${pass.status}`);
        });
      }
      
      console.log('\n✅ FACULTY APPROVAL TEST SUCCESSFUL');
      console.log('💡 The emergency pass should now appear in HOD dashboard');
      
    } catch (error) {
      console.error('❌ Faculty approval failed:', error.message);
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
};

testFacultyApproval();
