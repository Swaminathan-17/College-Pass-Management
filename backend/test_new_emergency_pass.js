const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');
const PassRequest = require('./models/PassRequest');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const testNewEmergencyPass = async () => {
  try {
    console.log('\n=== TESTING NEW EMERGENCY PASS CREATION ===\n');
    
    // Find student and HOD
    const student = await Student.findOne({}).populate('userId');
    const hodFaculty = await Faculty.findOne({ isHOD: true }).populate('userId');
    
    if (!student || !hodFaculty) {
      console.log('❌ Student or HOD not found');
      return;
    }
    
    console.log(`✅ Student: ${student.userId.name}`);
    console.log(`✅ HOD: ${hodFaculty.userId.name}`);
    
    // Create a new emergency pass request with proper HOD assignment
    const newEmergencyPass = new PassRequest({
      studentId: student._id,
      passType: 'emergency',
      isEmergency: true,
      reason: 'Test emergency pass',
      destination: 'Test destination',
      outDate: new Date().toISOString().split('T')[0],
      outTime: '12:00',
      expectedReturnTime: '23:59',
      status: 'REQUESTED',
      assignedHodId: hodFaculty._id
    });
    
    await newEmergencyPass.save();
    console.log(`✅ Created new emergency pass: ${newEmergencyPass._id}`);
    
    // Test the HOD approval process
    const populatedPass = await PassRequest.findById(newEmergencyPass._id)
      .populate('studentId')
      .populate({
        path: 'assignedHodId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    console.log(`✅ HOD Name in populated pass: ${populatedPass.assignedHodId?.userId?.name}`);
    
    // Simulate HOD approval
    populatedPass.status = 'HOD_APPROVED';
    populatedPass.hodRemark = 'Test approval';
    populatedPass.passCode = 'TEST123';
    
    // Test PDF generation logic
    const studentObj = await Student.findById(populatedPass.studentId._id);
    const hodName = populatedPass.assignedHodId?.userId?.name || 'HOD';
    
    console.log(`✅ PDF will show: APPROVED BY: ${hodName}`);
    
    console.log('\n=== NEW EMERGENCY PASS TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
  
  process.exit(0);
};

testNewEmergencyPass();
