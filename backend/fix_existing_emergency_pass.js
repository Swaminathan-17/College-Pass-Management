const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');
const PassRequest = require('./models/PassRequest');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const fixExistingEmergencyPass = async () => {
  try {
    console.log('\n=== FIXING EXISTING EMERGENCY PASS ===\n');
    
    // Find the existing emergency pass
    const existingPass = await PassRequest.findOne({ isEmergency: true });
    if (!existingPass) {
      console.log('❌ No existing emergency pass found');
      return;
    }
    
    console.log(`✅ Found existing emergency pass: ${existingPass._id}`);
    console.log(`   Status: ${existingPass.status}`);
    console.log(`   Assigned HOD ID: ${existingPass.assignedHodId}`);
    
    // Find the HOD faculty
    const hodFaculty = await Faculty.findOne({ isHOD: true }).populate('userId');
    if (!hodFaculty) {
      console.log('❌ No HOD faculty found');
      return;
    }
    
    console.log(`✅ HOD Faculty: ${hodFaculty.userId.name}`);
    
    // Update the existing pass to ensure proper HOD assignment
    existingPass.assignedHodId = hodFaculty._id;
    await existingPass.save();
    
    console.log(`✅ Updated existing pass with HOD assignment`);
    
    // Test the updated pass with proper population
    const updatedPass = await PassRequest.findById(existingPass._id)
      .populate('studentId')
      .populate({
        path: 'assignedHodId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    console.log(`✅ Updated HOD Name: ${updatedPass.assignedHodId?.userId?.name}`);
    
    // Test PDF generation
    const student = await Student.findById(updatedPass.studentId._id);
    const hodName = updatedPass.assignedHodId?.userId?.name || 'HOD';
    
    console.log(`✅ PDF will show: APPROVED BY: ${hodName}`);
    
    console.log('\n=== EXISTING EMERGENCY PASS FIXED ===\n');
    
  } catch (error) {
    console.error('Error during fix:', error);
  }
  
  process.exit(0);
};

fixExistingEmergencyPass();
