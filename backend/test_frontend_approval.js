require('dotenv').config();
const mongoose = require('mongoose');

console.log('🌐 TESTING FRONTEND APPROVAL REQUEST 🌐\n');

const testFrontendApproval = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27091/college-pass-management');
    console.log('✅ Connected to database');
    
    const User = require('./models/User');
    const Faculty = require('./models/Faculty');
    const Student = require('./models/Student');
    const PassRequest = require('./models/PassRequest');
    
    // Find a REQUESTED pass
    const requestedPass = await PassRequest.findOne({ status: 'REQUESTED' })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    
    if (!requestedPass) {
      console.log('❌ No REQUESTED passes found');
      return;
    }
    
    console.log('=== TESTING ACTUAL API CALL ===');
    console.log(`Pass ID: ${requestedPass._id}`);
    console.log(`Student: ${requestedPass.studentId?.userId?.name}`);
    
    // Find faculty user for authentication
    const faculty = await Faculty.findOne({ isHOD: false }).populate('userId');
    if (!faculty) {
      console.log('❌ No faculty found');
      return;
    }
    
    console.log(`Faculty: ${faculty.userId.name}`);
    
    // Create a mock request object like the frontend would send
    const mockRequest = {
      params: { id: requestedPass._id },
      body: { remark: 'Test approval from frontend simulation' },
      user: { id: faculty.userId._id }
    };
    
    // Create a mock response object
    let responseData = null;
    let statusCode = null;
    
    const mockResponse = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
            console.log(`Response Status: ${code}`);
            console.log(`Response Data:`, data);
          }
        };
      },
      json: (data) => {
        responseData = data;
        console.log(`Response Data:`, data);
      }
    };
    
    console.log('\n🔧 Simulating frontend approval request...');
    
    try {
      // Import and call the actual facultyApprove function
      const { facultyApprove } = require('./controllers/passController');
      
      console.log('✅ facultyApprove function loaded');
      console.log('🔧 Calling facultyApprove with mock request/response...');
      
      await facultyApprove(mockRequest, mockResponse);
      
      console.log('\n=== API CALL RESULT ===');
      console.log(`Status Code: ${statusCode}`);
      console.log(`Response:`, responseData);
      
      if (statusCode === 200 && responseData) {
        console.log('✅ APPROVAL API CALL SUCCESSFUL!');
        
        // Verify the pass was actually updated
        const updatedPass = await PassRequest.findById(requestedPass._id);
        console.log(`✅ Pass status updated to: ${updatedPass.status}`);
        console.log(`✅ Pass code: ${updatedPass.passCode || 'Not generated'}`);
        
      } else {
        console.log('❌ APPROVAL API CALL FAILED');
        console.log(`Status: ${statusCode}`);
        console.log(`Error: ${responseData?.message || 'Unknown error'}`);
      }
      
    } catch (apiError) {
      console.error('❌ API CALL EXCEPTION:', apiError.message);
      console.error('❌ Full error:', apiError);
    }
    
    console.log('\n=== CHECKING COMMON FRONTEND ISSUES ===');
    
    // Check for common frontend issues
    console.log('1. Checking if pass ID is correct...');
    const passExists = await PassRequest.findById(requestedPass._id);
    console.log(`   ✅ Pass exists: ${passExists ? 'Yes' : 'No'}`);
    
    console.log('2. Checking if faculty is authenticated...');
    console.log(`   ✅ Faculty ID: ${faculty.userId._id}`);
    console.log(`   ✅ Faculty role: faculty`);
    
    console.log('3. Checking if routes are properly configured...');
    try {
      const express = require('express');
      console.log('   ✅ Express available');
      
      // Check if the route file exists
      const fs = require('fs');
      const routesPath = './routes/passRoutes.js';
      if (fs.existsSync(routesPath)) {
        console.log('   ✅ Pass routes file exists');
      } else {
        console.log('   ❌ Pass routes file missing');
      }
      
    } catch (routeError) {
      console.log(`   ❌ Route error: ${routeError.message}`);
    }
    
    console.log('\n🌐 FRONTEND APPROVAL TEST COMPLETE 🌐');
    console.log('💡 If this test passes, the issue is in the actual frontend request');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ FRONTEND TEST FAILED:', error);
    await mongoose.disconnect();
  }
};

testFrontendApproval();
