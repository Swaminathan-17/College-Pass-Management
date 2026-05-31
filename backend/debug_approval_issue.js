require('dotenv').config();
const mongoose = require('mongoose');

console.log('=== DEBUGGING APPROVAL ISSUE ===\n');

const debugApprovalIssue = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    // Import models
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    console.log('=== CHECKING CURRENT PASS REQUESTS ===');
    
    // Check all pending pass requests
    const allPasses = await PassRequest.find({})
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedFacultyId')
      .populate('assignedHodId');
    
    console.log(`Total pass requests: ${allPasses.length}`);
    
    allPasses.forEach((pass, index) => {
      console.log(`\n${index + 1}. Pass ID: ${pass._id}`);
      console.log(`   Student: ${pass.studentId?.userId?.name || 'Unknown'}`);
      console.log(`   Residence: ${pass.studentId?.residenceType || 'Unknown'}`);
      console.log(`   Pass Type: ${pass.passType}`);
      console.log(`   Status: ${pass.status}`);
      console.log(`   Emergency: ${pass.isEmergency || false}`);
      console.log(`   Pass Code: ${pass.passCode || 'Not generated'}`);
      console.log(`   Assigned Faculty: ${pass.assignedFacultyId?.userId?.name || 'None'}`);
      console.log(`   Assigned HOD: ${pass.assignedHodId?.userId?.name || 'None'}`);
    });
    
    console.log('\n=== CHECKING APPROVAL READINESS ===');
    
    // Check for REQUESTED passes
    const requestedPasses = allPasses.filter(pass => pass.status === 'REQUESTED');
    console.log(`\nRequested passes: ${requestedPasses.length}`);
    
    requestedPasses.forEach((pass, index) => {
      console.log(`\n${index + 1}. REQUESTED Pass:`);
      console.log(`   Student: ${pass.studentId?.userId?.name} (${pass.studentId?.residenceType})`);
      console.log(`   Pass Type: ${pass.passType} (Emergency: ${pass.isEmergency})`);
      console.log(`   Expected Workflow: ${getExpectedWorkflow(pass.studentId?.residenceType, pass.passType, pass.isEmergency)}`);
    });
    
    // Check for FACULTY_APPROVED passes
    const facultyApprovedPasses = allPasses.filter(pass => pass.status === 'FACULTY_APPROVED');
    console.log(`\nFaculty-approved passes: ${facultyApprovedPasses.length}`);
    
    facultyApprovedPasses.forEach((pass, index) => {
      console.log(`\n${index + 1}. FACULTY_APPROVED Pass:`);
      console.log(`   Student: ${pass.studentId?.userId?.name} (${pass.studentId?.residenceType})`);
      console.log(`   Pass Type: ${pass.passType} (Emergency: ${pass.isEmergency})`);
      console.log(`   Next Approver: ${getNextApprover(pass.studentId?.residenceType, pass.passType, pass.isEmergency)}`);
    });
    
    // Check faculty and HOD availability
    console.log('\n=== CHECKING APPROVER AVAILABILITY ===');
    
    const faculty = await Faculty.find({}).populate('userId');
    const hod = faculty.find(f => f.isHOD);
    const regularFaculty = faculty.filter(f => !f.isHOD);
    
    console.log(`Total faculty: ${faculty.length}`);
    console.log(`HOD: ${hod?.userId?.name || 'Not found'}`);
    console.log(`Regular faculty: ${regularFaculty.length}`);
    regularFaculty.forEach(f => console.log(`   - ${f.userId?.name}`));
    
    // Check warden availability
    const warden = await User.findOne({ role: 'warden' });
    console.log(`Warden: ${warden?.name || 'Not found'}`);
    
    console.log('\n=== POTENTIAL ISSUES ===');
    
    // Check for potential issues
    if (requestedPasses.length > 0) {
      console.log('⚠️  Found passes waiting for faculty approval');
    }
    
    if (facultyApprovedPasses.length > 0) {
      console.log('⚠️  Found passes waiting for next level approval');
      
      facultyApprovedPasses.forEach(pass => {
        const nextApprover = getNextApprover(pass.studentId?.residenceType, pass.passType, pass.isEmergency);
        if (nextApprover === 'HOD' && !hod) {
          console.log(`❌ Emergency pass needs HOD but no HOD found`);
        }
        if (nextApprover === 'Warden' && !warden) {
          console.log(`❌ Hosteller pass needs Warden but no Warden found`);
        }
      });
    }
    
    console.log('\n✅ DEBUG COMPLETE');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await mongoose.disconnect();
  }
};

function getExpectedWorkflow(residenceType, passType, isEmergency) {
  if (residenceType === 'hosteller') {
    if (isEmergency || passType === 'emergency') {
      return 'Faculty → HOD → Student';
    } else {
      return 'Faculty → Warden → Student';
    }
  } else {
    return 'Faculty → Student';
  }
}

function getNextApprover(residenceType, passType, isEmergency) {
  if (residenceType === 'hosteller') {
    if (isEmergency || passType === 'emergency') {
      return 'HOD';
    } else {
      return 'Warden';
    }
  } else {
    return 'Student (Final)';
  }
}

debugApprovalIssue();
