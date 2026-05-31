const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');
const PassRequest = require('./models/PassRequest');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const comprehensiveHODFix = async () => {
  try {
    console.log('\n=== COMPREHENSIVE HOD PDF FIX ===\n');
    
    // 1. Find HOD user and faculty record
    console.log('1. HOD User and Faculty Record:');
    const hodUser = await User.findOne({ name: /hod/i });
    if (!hodUser) {
      console.log('   ❌ No HOD user found');
      return;
    }
    
    console.log(`   ✅ HOD User: ${hodUser.name} (${hodUser.email})`);
    
    const hodFaculty = await Faculty.findOne({ userId: hodUser._id });
    if (!hodFaculty) {
      console.log('   ❌ No faculty record for HOD');
      return;
    }
    
    console.log(`   ✅ HOD Faculty: ID=${hodFaculty._id}, Dept=${hodFaculty.department}, isHOD=${hodFaculty.isHOD}`);
    
    // 2. Check all emergency pass requests
    console.log('\n2. Emergency Pass Requests:');
    const emergencyPasses = await PassRequest.find({ isEmergency: true })
      .populate('studentId')
      .populate('assignedHodId')
      .populate('assignedFacultyId');
    
    console.log(`   Found ${emergencyPasses.length} emergency passes`);
    
    for (let i = 0; i < emergencyPasses.length; i++) {
      const pass = emergencyPasses[i];
      console.log(`   ${i + 1}. Pass ID: ${pass._id}`);
      console.log(`      Status: ${pass.status}`);
      console.log(`      Student: ${pass.studentId?.userId?.name || 'Unknown'}`);
      console.log(`      Assigned HOD ID: ${pass.assignedHodId?._id}`);
      console.log(`      Assigned HOD Name: ${pass.assignedHodId?.userId?.name || 'NOT POPULATED'}`);
      console.log(`      Assigned Faculty ID: ${pass.assignedFacultyId?._id}`);
      console.log(`      Assigned Faculty Name: ${pass.assignedFacultyId?.userId?.name || 'NOT POPULATED'}`);
    }
    
    // 3. Test proper population
    console.log('\n3. Testing Proper HOD Population:');
    const properlyPopulatedPass = await PassRequest.findOne({ isEmergency: true })
      .populate('studentId')
      .populate({
        path: 'assignedHodId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    if (properlyPopulatedPass) {
      console.log(`   ✅ Properly populated HOD Name: ${properlyPopulatedPass.assignedHodId?.userId?.name}`);
      
      // Test the exact PDF generation logic
      const student = await Student.findById(properlyPopulatedPass.studentId._id);
      const hodName = properlyPopulatedPass.assignedHodId?.userId?.name || 'HOD';
      
      console.log(`   ✅ PDF would show: APPROVED BY: ${hodName}`);
      
      // 4. Update any existing emergency passes that don't have proper HOD assignment
      console.log('\n4. Fixing Emergency Pass HOD Assignment:');
      const passesNeedingFix = await PassRequest.find({ 
        isEmergency: true,
        assignedHodId: { $exists: false }
      });
      
      console.log(`   Found ${passesNeedingFix.length} passes needing HOD assignment`);
      
      for (const pass of passesNeedingFix) {
        console.log(`   Fixing pass: ${pass._id}`);
        pass.assignedHodId = hodFaculty._id;
        await pass.save();
        console.log(`   ✅ Fixed pass ${pass._id}`);
      }
      
    } else {
      console.log('   ❌ No emergency pass found for testing');
    }
    
    console.log('\n=== COMPREHENSIVE FIX COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during comprehensive fix:', error);
  }
  
  process.exit(0);
};

comprehensiveHODFix();
