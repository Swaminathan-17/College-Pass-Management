const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const testFrontendAPI = async () => {
  try {
    console.log('\n=== TESTING FRONTEND API RESPONSE ===\n');
    
    // Simulate what happens when HOD user calls getPendingPasses
    const hodUser = await User.findOne({ name: /hod/i });
    if (!hodUser) {
      console.log('❌ No HOD user found');
      process.exit(0);
    }
    
    console.log(`✅ Simulating API call for HOD: ${hodUser.name}`);
    
    // Simulate req.user.id
    const mockReq = { user: { id: hodUser._id } };
    
    // Import and test the actual getPendingPasses function
    const { getPendingPasses } = require('./controllers/passController');
    
    // Create mock response object
    let responseData = null;
    const mockRes = {
      json: (data) => {
        responseData = data;
        console.log('✅ API Response Data:');
        console.log(`   Total passes returned: ${data.length}`);
        data.forEach((pass, index) => {
          console.log(`   ${index + 1}. Student: ${pass.studentId?.userId?.name}`);
          console.log(`      Status: ${pass.status}`);
          console.log(`      Emergency: ${pass.isEmergency}`);
          console.log(`      Pass Type: ${pass.passType}`);
          console.log(`      Assigned HOD: ${pass.assignedHodId?.userId?.name}`);
          console.log('      ---');
        });
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ API Error (${code}): ${data.message}`);
        }
      })
    };
    
    // Call the actual function
    await getPendingPasses(mockReq, mockRes);
    
    console.log('\n=== FRONTEND API TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during frontend API test:', error);
  }
  
  process.exit(0);
};

testFrontendAPI();
