const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');
const PassRequest = require('./models/PassRequest');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const debugEmergencyPass = async () => {
  try {
    console.log('\n=== DEBUGGING EMERGENCY PASS ISSUE ===\n');
    
    // 1. Check all emergency pass requests
    console.log('1. All Emergency Pass Requests:');
    const emergencyPasses = await PassRequest.find({ isEmergency: true })
      .populate('studentId', 'userId rollNo department')
      .populate('assignedHodId', 'userId department')
      .populate('assignedFacultyId', 'userId department');
    
    if (emergencyPasses.length === 0) {
      console.log('   ❌ No emergency pass requests found in database');
    } else {
      emergencyPasses.forEach((pass, index) => {
        console.log(`   ${index + 1}. Emergency Pass:`);
        console.log(`      - ID: ${pass._id}`);
        console.log(`      - Status: ${pass.status}`);
        console.log(`      - Student: ${pass.studentId?.userId?.name} (${pass.studentId?.rollNo})`);
        console.log(`      - Student Department: ${pass.studentId?.department}`);
        console.log(`      - Assigned HOD: ${pass.assignedHodId?.userId?.name} (${pass.assignedHodId?.department})`);
        console.log(`      - Assigned Faculty: ${pass.assignedFacultyId?.userId?.name}`);
        console.log(`      - Created: ${pass.createdAt}`);
        console.log('      ---');
      });
    }
    
    // 2. Check HOD faculty records
    console.log('\n2. HOD Faculty Records:');
    const hodFaculty = await Faculty.find({ isHOD: true }).populate('userId', 'name email');
    if (hodFaculty.length === 0) {
      console.log('   ❌ No HOD faculty records found');
    } else {
      hodFaculty.forEach(hod => {
        console.log(`   - HOD: ${hod.userId.name} (${hod.department})`);
        console.log(`     Faculty ID: ${hod._id}`);
        console.log(`     User ID: ${hod.userId._id}`);
        console.log('     ---');
      });
    }
    
    // 3. Test the HOD query from getPendingPasses
    console.log('\n3. Testing HOD Query (from getPendingPasses):');
    if (hodFaculty.length > 0) {
      const testHOD = hodFaculty[0]; // Use first HOD for testing
      console.log(`   Testing with HOD: ${testHOD.userId.name}`);
      
      const hodPasses = await PassRequest.find({
        status: 'REQUESTED',
        isEmergency: true,
        assignedHodId: testHOD._id
      })
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        })
        .populate('assignedHodId')
        .sort({ createdAt: -1 });
      
      console.log(`   Found ${hodPasses.length} emergency passes for this HOD`);
      hodPasses.forEach(pass => {
        console.log(`     - ${pass.studentId?.userId?.name}: ${pass.status}`);
      });
    }
    
    // 4. Check all users with HOD role
    console.log('\n4. Users with HOD Role:');
    const hodUsers = await User.find({ role: 'hod' });
    if (hodUsers.length === 0) {
      console.log('   ❌ No users with role "hod" found');
      console.log('   Checking for faculty with HOD in name...');
      const hodByName = await User.find({ name: /hod/i });
      console.log(`   Found ${hodByName.length} users with "HOD" in name:`);
      hodByName.forEach(user => {
        console.log(`     - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      hodUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }
    
    console.log('\n=== DEBUGGING COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
  
  process.exit(0);
};

debugEmergencyPass();
