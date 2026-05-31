const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const testHODAPI = async () => {
  try {
    console.log('\n=== TESTING HOD API LOGIC ===\n');
    
    // Find the HOD user
    const hodUser = await User.findOne({ name: /hod/i });
    if (!hodUser) {
      console.log('❌ No HOD user found');
      process.exit(0);
    }
    
    console.log(`✅ Found HOD user: ${hodUser.name} (${hodUser.email})`);
    console.log(`   Role: ${hodUser.role}`);
    console.log(`   User ID: ${hodUser._id}`);
    
    // Find the faculty record for this HOD
    const hodFaculty = await Faculty.findOne({ userId: hodUser._id });
    if (!hodFaculty) {
      console.log('❌ No faculty record found for HOD user');
      process.exit(0);
    }
    
    console.log(`✅ Found faculty record:`);
    console.log(`   Faculty ID: ${hodFaculty._id}`);
    console.log(`   Department: ${hodFaculty.department}`);
    console.log(`   isHOD: ${hodFaculty.isHOD}`);
    console.log(`   Designation: ${hodFaculty.designation}`);
    
    // Simulate the getPendingPasses logic for this HOD
    console.log('\n=== SIMULATING getPendingPasses FOR HOD ===\n');
    
    const PassRequest = require('./models/PassRequest');
    const passes = await PassRequest.find({
      status: 'REQUESTED',
      isEmergency: true,
      assignedHodId: hodFaculty._id
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
    
    console.log(`Found ${passes.length} emergency passes for HOD`);
    passes.forEach((pass, index) => {
      console.log(`${index + 1}. ${pass.studentId?.userId?.name} - ${pass.status}`);
    });
    
    console.log('\n=== API TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during API test:', error);
  }
  
  process.exit(0);
};

testHODAPI();
