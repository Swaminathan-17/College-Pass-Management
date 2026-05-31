const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const fixHOD = async () => {
  try {
    console.log('=== FIXING HOD STATUS ===\n');
    
    // Find the faculty member who should be HOD
    const hodFaculty = await Faculty.findOne({}).populate('userId', 'name email');
    
    // First find Mani HOD by user email
    const user = await User.findOne({ email: 'vsubra70@gmail.com' });
    console.log(`Found user: ${user ? user.name : 'Not found'}`);
    
    if (user) {
      // Then update the faculty record
      const maniHOD = await Faculty.findOneAndUpdate(
        { userId: user._id },
        { isHOD: true },
        { returnDocument: 'after' }
      ).populate('userId', 'name email');
      
      if (maniHOD) {
        console.log('✅ Successfully updated Mani HOD:');
        console.log(`   - Name: ${maniHOD.userId.name}`);
        console.log(`   - Email: ${maniHOD.userId.email}`);
        console.log(`   - Department: ${maniHOD.department}`);
        console.log(`   - Designation: ${maniHOD.designation}`);
        console.log(`   - isHOD: ${maniHOD.isHOD}`);
      } else {
        console.log('❌ Could not find faculty record for Mani HOD');
      }
    } else {
      console.log('❌ Could not find user with email vsubra70@gmail.com');
    }
    
    if (maniHOD) {
      console.log('✅ Successfully updated Mani HOD:');
      console.log(`   - Name: ${maniHOD.userId.name}`);
      console.log(`   - Email: ${maniHOD.userId.email}`);
      console.log(`   - Department: ${maniHOD.department}`);
      console.log(`   - Designation: ${maniHOD.designation}`);
      console.log(`   - isHOD: ${maniHOD.isHOD}`);
    } else {
      console.log('❌ Could not find Mani HOD to update');
    }
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===\n');
    const allHODs = await Faculty.find({ isHOD: true }).populate('userId', 'name email');
    console.log(`Total HODs in system: ${allHODs.length}`);
    allHODs.forEach(hod => {
      console.log(`- ${hod.userId.name} (${hod.department})`);
    });
    
    console.log('\n=== HOD STATUS FIXED ===\n');
    
  } catch (error) {
    console.error('Error fixing HOD:', error);
  }
  
  process.exit(0);
};

fixHOD();
