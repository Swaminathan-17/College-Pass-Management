const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college-pass-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const debugHOD = async () => {
  try {
    console.log('\n=== DEBUGGING HOD ISSUE ===\n');
    
    // 1. Check all Users with HOD role
    console.log('1. All Users with role "hod":');
    const hodUsers = await User.find({ role: 'hod' });
    hodUsers.forEach(user => {
      console.log(`   - ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // 2. Check all Faculty records
    console.log('\n2. All Faculty records:');
    const allFaculty = await Faculty.find({}).populate('userId', 'name email role');
    allFaculty.forEach(faculty => {
      console.log(`   - Faculty ID: ${faculty._id}`);
      console.log(`     User ID: ${faculty.userId._id}`);
      console.log(`     Name: ${faculty.userId.name}`);
      console.log(`     Email: ${faculty.userId.email}`);
      console.log(`     User Role: ${faculty.userId.role}`);
      console.log(`     Department: "${faculty.department}"`);
      console.log(`     Designation: "${faculty.designation}"`);
      console.log(`     isClassIncharge: ${faculty.isClassIncharge}`);
      console.log(`     isHOD: ${faculty.isHOD}`);
      console.log('     ---');
    });
    
    // 3. Check specifically for HOD faculty
    console.log('\n3. Faculty records with isHOD = true:');
    const hodFaculty = await Faculty.find({ isHOD: true }).populate('userId', 'name email role');
    if (hodFaculty.length === 0) {
      console.log('   ❌ NO FACULTY RECORDS FOUND WITH isHOD = true');
    } else {
      hodFaculty.forEach(faculty => {
        console.log(`   ✅ Found HOD Faculty:`);
        console.log(`      - Faculty ID: ${faculty._id}`);
        console.log(`      - Name: ${faculty.userId.name}`);
        console.log(`      - Email: ${faculty.userId.email}`);
        console.log(`      - User Role: ${faculty.userId.role}`);
        console.log(`      - Department: "${faculty.department}"`);
        console.log(`      - Designation: "${faculty.designation}"`);
      });
    }
    
    // 4. Check Students and their departments
    console.log('\n4. Student records and their departments:');
    const students = await Student.find({}).populate('userId', 'name email');
    students.forEach(student => {
      console.log(`   - Student: ${student.userId.name}`);
      console.log(`     Roll No: ${student.rollNo}`);
      console.log(`     Department: "${student.department}"`);
      console.log(`     Residence: ${student.residenceType}`);
      console.log('     ---');
    });
    
    // 5. Test the faculty API query
    console.log('\n5. Testing faculty API query (same as getFacultyList):');
    const facultyForAPI = await Faculty.find({})
      .populate('userId', 'name email')
      .select('userId department designation classes isClassIncharge isHOD');
    
    console.log(`   Total faculty found: ${facultyForAPI.length}`);
    
    const facultyList = facultyForAPI
      .filter(f => f.userId)
      .map(f => ({
        _id: f._id,
        name: f.userId.name,
        email: f.userId.email,
        department: f.department,
        designation: f.designation,
        classes: f.classes,
        isClassIncharge: f.isClassIncharge,
        isHOD: f.isHOD
      }));
    
    console.log('   Processed faculty list:');
    facultyList.forEach(f => {
      console.log(`     - ${f.name}: ${f.department}, isHOD: ${f.isHOD}`);
    });
    
    const hodsInList = facultyList.filter(f => f.isHOD);
    console.log(`   HODs in processed list: ${hodsInList.length}`);
    hodsInList.forEach(hod => {
      console.log(`     - ${hod.name}: ${hod.department}`);
    });
    
    console.log('\n=== DEBUGGING COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
  
  process.exit(0);
};

debugHOD();
