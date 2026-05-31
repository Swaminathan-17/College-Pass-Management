const { randomBytes } = require('crypto');
const path = require('path');
const PassRequest = require('../models/PassRequest');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const SecurityVerification = require('../models/SecurityVerification');
const { generatePassPDFSinglePage } = require('../utils/pdfGeneratorSinglePage');
const { sendStudentPassApproval, sendParentNotification } = require('../utils/emailService');
const PDFDocument = require('pdfkit');

const requestPass = async (req, res) => {
  try {
    const { passType, reason, destination, outDate, outTime, expectedReturnTime, classInchargeId } = req.body;

    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ message: 'Student is blocked from requesting passes' });
    }

    // Validate date based on pass type and student residence
    const requestedDate = new Date(outDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestedDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.ceil((requestedDate - today) / (1000 * 60 * 60 * 24));
    const currentHour = new Date().getHours();
    
    const isEmergency = passType === 'emergency';
    const isExpress = passType === 'express';
    
    if (isEmergency) {
      if (daysDifference < 0) {
        return res.status(400).json({ message: 'Emergency pass date cannot be in the past' });
      }
    } else if (isExpress) {
      // Express pass logic - only for day-scholars and before 12 PM
      if (student.residenceType !== 'day-scholar') {
        return res.status(400).json({ message: 'Express passes are only available for day-scholars' });
      }
      if (currentHour >= 12) {
        return res.status(400).json({ message: 'Express passes must be requested before 12:00 PM' });
      }
      if (daysDifference < 0) {
        return res.status(400).json({ message: 'Express pass date cannot be in the past' });
      }
    } else {
      // Regular pass logic - 1 day advance for everyone
      if (daysDifference < 1) {
        return res.status(400).json({ message: 'Regular passes must be submitted at least 1 day in advance' });
      }
    }

    let passRequestData = {
      studentId: student._id,
      passType,
      isEmergency,
      isExpress,
      reason,
      destination,
      outDate,
      outTime,
      expectedReturnTime
    };

    // Handle emergency passes - send directly to HOD
    if (isEmergency) {
      const Faculty = require('../models/Faculty');
      const hod = await Faculty.findOne({ 
        department: student.department, 
        isHOD: true 
      }).populate('userId');
      
      if (!hod) {
        return res.status(400).json({ message: 'No HOD found for your department' });
      }
      
      passRequestData.assignedHodId = hod._id;
      
      // Send email to HOD
      const { sendHodEmergencyNotification } = require('../utils/emailService');
      await sendHodEmergencyNotification(hod.userId.email, student.userId.name, {
        passType,
        reason,
        destination,
        outDate,
        outTime,
        expectedReturnTime
      });
    } else {
      // Handle regular passes - send to faculty
      let assignedFacultyId = student.classInchargeId;
      if (classInchargeId) {
        const Faculty = require('../models/Faculty');
        const faculty = await Faculty.findById(classInchargeId).populate('userId');
        if (!faculty || !faculty.isClassIncharge || faculty.department !== student.department) {
          return res.status(400).json({ message: 'Invalid class incharge selected' });
        }
        assignedFacultyId = classInchargeId;

        // Send email notification to faculty
        const { sendFacultyNotification } = require('../utils/emailService');
        await sendFacultyNotification(faculty.userId.email, student.userId.name, {
          passType,
          reason,
          destination,
          outDate,
          outTime,
          expectedReturnTime
        });
      }
      
      passRequestData.assignedFacultyId = assignedFacultyId;
    }

    const passRequest = new PassRequest(passRequestData);
    await passRequest.save();
    await passRequest.populate('studentId');
    
    if (passRequest.assignedFacultyId) {
      await passRequest.populate('assignedFacultyId');
    }
    if (passRequest.assignedHodId) {
      await passRequest.populate('assignedHodId');
    }

    res.status(201).json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPassHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const passes = await PassRequest.find({ studentId: student._id })
      .populate('studentId')
      .sort({ createdAt: -1 });

    res.json(passes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const facultyApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate('assignedFacultyId');
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (passRequest.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'Pass cannot be approved at this stage' });
    }

    // Student is already populated, no need to fetch again
    const student = passRequest.studentId;
    
    // Handle different approval workflows based on residence type and pass type
    if (student.residenceType === 'hosteller') {
      if (passRequest.passType === 'emergency') {
        // Emergency pass for hosteller: faculty approval forwards to HOD (HOD approval is final)
        passRequest.status = 'FACULTY_APPROVED';
        passRequest.facultyRemark = remark || 'Approved by faculty - forwarded to HOD';
        await passRequest.save();
        
        // Send notification to HOD for emergency approval
        try {
          const hodFaculty = await Faculty.findOne({ isHOD: true }).populate('userId');
        const hodUser = hodFaculty ? hodFaculty.userId : null;
          if (hodUser) {
            const { sendHodEmergencyNotification } = require('../utils/emailService');
            await sendHodEmergencyNotification(
              hodUser.email,
              passRequest.studentId.userId.name,
              {
                passType: passRequest.passType,
                reason: passRequest.reason,
                destination: passRequest.destination,
                outDate: passRequest.outDate,
                outTime: passRequest.outTime,
                expectedReturnTime: passRequest.expectedReturnTime
              }
            );
          }
        } catch (emailError) {
          console.error('Error sending HOD notification:', emailError);
        }
        
      } else {
        // Normal pass for hosteller: faculty approval forwards to warden
        passRequest.status = 'FACULTY_APPROVED';
        passRequest.facultyRemark = remark || 'Approved by faculty - forwarded to warden';
        await passRequest.save();
        
        // Send email notification to warden
        try {
          const wardenUser = await User.findOne({ role: 'warden' });
          if (wardenUser) {
            const { sendWardenNotification } = require('../utils/emailService');
            await sendWardenNotification(
              wardenUser.email,
              passRequest.assignedFacultyId.userId.name,
              passRequest.studentId.userId.name,
              {
                passType: passRequest.passType,
                reason: passRequest.reason,
                destination: passRequest.destination,
                outDate: passRequest.outDate,
                outTime: passRequest.outTime,
                expectedReturnTime: passRequest.expectedReturnTime
              }
            );
          }
        } catch (emailError) {
          console.error('Error sending warden notification:', emailError);
        }
      }
    } else {
      // For day-scholars, faculty approval is final - generate pass code and send to student
      passRequest.status = 'FACULTY_APPROVED';
      passRequest.facultyRemark = remark || 'Approved by faculty';
      await passRequest.save();
      
      try {
        passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();
        
        // Generate PDF
        const facultyName = passRequest.assignedFacultyId?.userId?.name || 'Faculty';
        const pdfPath = await generatePassPDFSinglePage(passRequest, student, facultyName);
        passRequest.pdfUrl = pdfPath;
        await passRequest.save();

        // Send email notifications to student
        const studentUser = await User.findById(passRequest.studentId.userId);
        if (studentUser) {
          // Convert relative path to absolute path for email attachment
          const absolutePdfPath = path.join(__dirname, '..', pdfPath);
          await sendStudentPassApproval(
            studentUser.email,
            studentUser.name,
            passRequest.passCode,
            absolutePdfPath
          );

          // Send notification to parent
          if (passRequest.studentId.parentEmail) {
            await sendParentNotification(
              passRequest.studentId.parentEmail,
              studentUser.name,
              {
                destination: passRequest.destination,
                outDate: passRequest.outDate,
                outTime: passRequest.outTime,
                expectedReturnTime: passRequest.expectedReturnTime
              }
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending day-scholar notifications:', emailError);
      }
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const facultyReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id).populate('studentId');
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (passRequest.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'Pass cannot be rejected at this stage' });
    }

    passRequest.status = 'REJECTED';
    passRequest.facultyRemark = remark || 'Rejected by faculty';
    await passRequest.save();

    // Send rejection email to student
    try {
      const studentUser = await User.findById(passRequest.studentId.userId);
      if (studentUser) {
        const { sendPassRejectionEmail } = require('../utils/emailService');
        await sendPassRejectionEmail(
          studentUser.email,
          'student',
          studentUser.name,
          remark,
          {
            passType: passRequest.passType,
            destination: passRequest.destination,
            outDate: passRequest.outDate,
            outTime: passRequest.outTime,
            reason: passRequest.reason
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const hodApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .populate({
        path: 'assignedHodId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (!passRequest.isEmergency || !['REQUESTED', 'FACULTY_APPROVED'].includes(passRequest.status)) {
      return res.status(400).json({ message: 'Invalid request for HOD approval' });
    }

    passRequest.status = 'HOD_APPROVED';
    passRequest.hodRemark = remark || 'Approved by HOD';
    passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();

    // Student is already populated with userId, no need to fetch again
    const student = passRequest.studentId;

    // Generate PDF
    const hodName = passRequest.assignedHodId?.userId?.name || 'HOD';
    const pdfPath = await generatePassPDFSinglePage(passRequest, student, hodName);
    passRequest.pdfUrl = pdfPath;
    await passRequest.save();

    // Send email notifications
    try {
      const studentUser = passRequest.studentId.userId;
      if (studentUser) {
        // Send pass approval email to student
        const absolutePdfPath = path.join(__dirname, '..', pdfPath);
        await sendStudentPassApproval(
          studentUser.email,
          studentUser.name,
          passRequest.passCode,
          absolutePdfPath
        );

        // Send notification to parent
        if (passRequest.studentId.parentEmail) {
          await sendParentNotification(
            passRequest.studentId.parentEmail,
            studentUser.name,
            {
              destination: passRequest.destination,
              outDate: passRequest.outDate,
              outTime: passRequest.outTime,
              expectedReturnTime: passRequest.expectedReturnTime
            }
          );
        }
      }
    } catch (emailError) {
      console.error('Error sending student notifications:', emailError);
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const hodReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id).populate('studentId');
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (!passRequest.isEmergency || passRequest.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'Invalid request for HOD rejection' });
    }

    passRequest.status = 'REJECTED';
    passRequest.hodRemark = remark || 'Rejected by HOD';
    await passRequest.save();

    // Send rejection email to student
    try {
      const studentUser = await User.findById(passRequest.studentId.userId);
      if (studentUser) {
        const { sendPassRejectionEmail } = require('../utils/emailService');
        await sendPassRejectionEmail(
          studentUser.email,
          'student',
          studentUser.name,
          remark,
          {
            passType: passRequest.passType,
            destination: passRequest.destination,
            outDate: passRequest.outDate,
            outTime: passRequest.outTime,
            reason: passRequest.reason
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const wardenApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id)
      .populate('studentId')
      .populate('assignedFacultyId');
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (passRequest.status !== 'FACULTY_APPROVED') {
      return res.status(400).json({ message: 'Pass must be faculty approved first' });
    }

    passRequest.status = 'WARDEN_APPROVED';
    passRequest.wardenRemark = remark || 'Approved by warden';
    passRequest.passCode = randomBytes(4).toString('hex').toUpperCase();

    // Generate PDF
    const facultyName = passRequest.assignedFacultyId?.userId?.name || 'Faculty';
    const pdfPath = await generatePassPDFSinglePage(passRequest, passRequest.studentId, facultyName);
    passRequest.pdfUrl = pdfPath;
    await passRequest.save();

    // Send email notifications
    try {
      const studentUser = await User.findById(passRequest.studentId.userId);
      if (studentUser) {
        // Send pass approval email to student
        const absolutePdfPath = path.join(__dirname, '..', pdfPath);
        await sendStudentPassApproval(
          studentUser.email,
          studentUser.name,
          passRequest.passCode,
          absolutePdfPath
        );

        // Send notification to parent
        if (passRequest.studentId.parentEmail) {
          await sendParentNotification(
            passRequest.studentId.parentEmail,
            studentUser.name,
            {
              destination: passRequest.destination,
              outDate: passRequest.outDate,
              outTime: passRequest.outTime,
              expectedReturnTime: passRequest.expectedReturnTime
            }
          );
        }
      }
    } catch (emailError) {
      console.error('Error sending student notifications:', emailError);
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const wardenReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const passRequest = await PassRequest.findById(id).populate('studentId');
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (passRequest.status !== 'FACULTY_APPROVED') {
      return res.status(400).json({ message: 'Pass must be faculty approved first' });
    }

    passRequest.status = 'REJECTED';
    passRequest.wardenRemark = remark || 'Rejected by warden';
    await passRequest.save();

    // Send rejection email to student
    try {
      const studentUser = await User.findById(passRequest.studentId.userId);
      if (studentUser) {
        const { sendPassRejectionEmail } = require('../utils/emailService');
        await sendPassRejectionEmail(
          studentUser.email,
          'student',
          studentUser.name,
          remark,
          {
            passType: passRequest.passType,
            destination: passRequest.destination,
            outDate: passRequest.outDate,
            outTime: passRequest.outTime,
            reason: passRequest.reason
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createVerificationHistory = async (passRequest, securityUserId, verificationType) => {
  try {
    // Get student details
    const student = await Student.findById(passRequest.studentId).populate('userId');
    
    // Get approval details
    let approvalDetails = {};
    if (passRequest.assignedFacultyId) {
      const faculty = await Faculty.findById(passRequest.assignedFacultyId).populate('userId');
      approvalDetails.facultyName = faculty?.userId?.name || 'N/A';
      approvalDetails.facultyRemark = passRequest.facultyRemark || 'N/A';
    }
    approvalDetails.hodName = passRequest.hodName || 'N/A';
    approvalDetails.hodRemark = passRequest.hodRemark || 'N/A';
    approvalDetails.wardenName = passRequest.wardenName || 'N/A';
    approvalDetails.wardenRemark = passRequest.wardenRemark || 'N/A';

    const verificationHistory = new SecurityVerification({
      passRequest: passRequest._id,
      student: passRequest.studentId,
      securityPersonnel: securityUserId,
      verificationType,
      passDetails: {
        passCode: passRequest.passCode,
        passType: passRequest.passType,
        destination: passRequest.destination,
        outDate: passRequest.outDate,
        outTime: passRequest.outTime,
        expectedReturnTime: passRequest.expectedReturnTime,
        reason: passRequest.reason,
        status: passRequest.status
      },
      approvalDetails,
      studentDetails: {
        rollNo: student.rollNo,
        name: student.userId.name,
        department: student.department,
        year: student.year,
        phone: student.phone
      }
    });

    await verificationHistory.save();
  } catch (error) {
    console.error('Error creating verification history:', error);
  }
};

const verifyPass = async (req, res) => {
  try {
    const { rollNo, passCode } = req.body;

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const passRequest = await PassRequest.findOne({
      studentId: student._id,
      passCode
    }).populate('studentId');

    if (!passRequest) {
      return res.status(404).json({ message: 'Invalid pass code' });
    }

    const activeStatuses = ['FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED', 'OUTSIDE'];
    if (!activeStatuses.includes(passRequest.status)) {
      return res.status(400).json({ message: 'Pass is not active' });
    }

    // Create verification history
    await createVerificationHistory(passRequest, req.user.id, 'VERIFY');

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markExit = async (req, res) => {
  try {
    const { id } = req.params;

    const passRequest = await PassRequest.findById(id);
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    const approvedStatuses = ['FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED'];
    if (!approvedStatuses.includes(passRequest.status)) {
      return res.status(400).json({ message: 'Pass is not approved for exit' });
    }

    passRequest.status = 'OUTSIDE';
    passRequest.exitTime = new Date();
    await passRequest.save();

    // Create verification history for check-out
    await createVerificationHistory(passRequest, req.user.id, 'CHECK_OUT');

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const passRequest = await PassRequest.findById(id);
    if (!passRequest) {
      return res.status(404).json({ message: 'Pass request not found' });
    }

    if (passRequest.status !== 'OUTSIDE') {
      return res.status(400).json({ message: 'Student is not marked as outside' });
    }

    passRequest.status = 'RETURNED';
    passRequest.returnTimeActual = new Date();
    await passRequest.save();

    // Create verification history for check-in
    await createVerificationHistory(passRequest, req.user.id, 'CHECK_IN');

    res.json(passRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVerificationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, verificationType, dateFrom, dateTo } = req.query;
    
    // Build query
    const query = {};
    if (verificationType) {
      query.verificationType = verificationType;
    }
    if (dateFrom || dateTo) {
      query.verifiedAt = {};
      if (dateFrom) query.verifiedAt.$gte = new Date(dateFrom);
      if (dateTo) query.verifiedAt.$lte = new Date(dateTo);
    }

    const verifications = await SecurityVerification.find(query)
      .populate('securityPersonnel', 'name email')
      .populate('student', 'rollNo')
      .sort({ verifiedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SecurityVerification.countDocuments(query);

    res.json({
      verifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingPasses = async (req, res) => {
  try {
    const User = require('../models/User');
    const Faculty = require('../models/Faculty');
    
    // Get current user details
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let passes;

    if (currentUser.role === 'faculty') {
      // For faculty: find their profile and assigned passes
      let faculty = await Faculty.findOne({ userId: req.user.id });
      
      // If faculty profile doesn't exist, create one with default values
      if (!faculty) {
        console.log(`Creating faculty profile for user: ${currentUser.name} (${req.user.id})`);
        faculty = new Faculty({
          userId: req.user.id,
          department: 'General',
          designation: 'Faculty',
          isClassIncharge: false,
          isHOD: false
        });
        await faculty.save();
        console.log(`Created faculty profile: ${faculty._id}`);
      }

      console.log(`Found faculty profile: ${faculty._id} for user: ${currentUser.name}`);

      // Check if this faculty is an HOD
      if (faculty.isHOD) {
        // For HODs: find all emergency pass requests assigned to them
        passes = await PassRequest.find({
          status: { $in: ['REQUESTED', 'FACULTY_APPROVED'] },
          isEmergency: true,
          assignedHodId: faculty._id
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
        
        console.log(`Found ${passes.length} emergency passes for HOD ${faculty._id}`);
      } else {
        // For regular faculty: find only their pending passes (not approved ones)
        passes = await PassRequest.find({
          status: 'REQUESTED',
          assignedFacultyId: faculty._id
        })
          .populate({
            path: 'studentId',
            populate: {
              path: 'userId',
              select: 'name email'
            }
          })
          .populate('assignedFacultyId')
          .sort({ createdAt: -1 });

        console.log(`Found ${passes.length} passes for faculty ${faculty._id}`);
      }
    } else if (currentUser.role === 'warden') {
      // For wardens: find all faculty-approved passes for hosteller students only
      passes = await PassRequest.find({
        status: 'FACULTY_APPROVED'
      })
        .populate({
          path: 'studentId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        })
        .populate('assignedFacultyId')
        .sort({ createdAt: -1 });
      
      // Filter to show only hosteller students
      passes = passes.filter(pass => pass.studentId?.residenceType === 'hosteller');
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(passes);
  } catch (error) {
    console.error('Error in getPendingPasses:', error);
    res.status(500).json({ message: 'Server error while fetching pending passes' });
  }
};

const deletePass = async (req, res) => {
  try {
    console.log('Delete pass request received for ID:', req.params.id);
    console.log('User ID from token:', req.user.id);
    
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      console.log('Student not found for user ID:', req.user.id);
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    console.log('Student found:', student._id);

    const pass = await PassRequest.findOne({ 
      _id: req.params.id, 
      studentId: student._id 
    });

    if (!pass) {
      console.log('Pass not found for ID:', req.params.id, 'and student:', student._id);
      return res.status(404).json({ message: 'Pass request not found' });
    }

    console.log('Pass found with status:', pass.status);

    // Allow deletion of all pass records (approved, rejected, requested, etc.)
    // This gives students full control over their pass history

    await PassRequest.findByIdAndDelete(req.params.id);
    console.log('Pass deleted successfully');

    res.json({ message: 'Pass request deleted successfully' });
  } catch (error) {
    console.error('Delete pass error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generatePassPDFDynamic = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Generating PDF for pass ID:', id);
    
    // Find the pass request with populated data
    const passRequest = await PassRequest.findById(id)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .populate({
        path: 'assignedFacultyId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });
    
    if (!passRequest) {
      console.log('❌ Pass request not found');
      return res.status(404).json({ message: 'Pass request not found' });
    }

    console.log('✅ Found pass request:', passRequest.passCode);

    // Check if pass is approved
    if (!passRequest.passCode) {
      console.log('❌ Pass is not approved yet');
      return res.status(400).json({ message: 'Pass is not approved yet' });
    }

    // Get student name from populated userId
    const studentName = passRequest.studentId?.userId?.name || 'Unknown Student';
    console.log('✅ Found student:', studentName);

    // Get approver name based on pass type
    let approverName;
    if (passRequest.isEmergency) {
      approverName = passRequest.assignedHodId?.userId?.name || 'HOD';
      console.log('✅ Found HOD:', approverName);
    } else {
      approverName = passRequest.assignedFacultyId?.userId?.name || 'Faculty';
      console.log('✅ Found faculty:', approverName);
    }

    // Create student object with name for PDF generation
    const studentWithDetails = {
      ...passRequest.studentId.toObject(),
      name: studentName
    };

    // Generate PDF dynamically
    const pdfBuffer = await generatePassPDFBuffer(passRequest, studentWithDetails, approverName);
    
    console.log('✅ PDF generated, size:', pdfBuffer.length);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="pass_${passRequest.passCode}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

const generatePassPDFBuffer = async (passRequest, student, facultyName) => {
  return new Promise((resolve, reject) => {
    try {
      // Create simple PDF with default settings
      const doc = new PDFDocument({
        size: 'A4',
        margin: 25
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Background - LIGHT
      doc.fillColor('#ffffff').rect(0, 0, pageWidth, pageHeight).fill();

      // Outer Border
      doc.strokeColor('#e5e7eb')
        .lineWidth(2)
        .roundedRect(15, 15, pageWidth - 30, pageHeight - 30, 10)
        .stroke();

      // Header - LIGHT BLUE
      doc.fillColor('#1e40af')
        .roundedRect(25, 25, pageWidth - 50, 80, 8)
        .fill();

      // Calculate center position within header bounds
      const headerLeft = 25;
      const headerWidth = pageWidth - 50;
      
      // Centered text
      doc.fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('SCSVMV UNIVERSITY', headerLeft, 45, {
          width: headerWidth,
          align: 'center'
        });

      doc.fillColor('#dbeafe')
        .fontSize(14)
        .font('Helvetica')
        .text('STUDENT GATE PASS', headerLeft, 70, {
          width: headerWidth,
          align: 'center'
        });

      // Student Details - NORMAL TEXT COLORS
      const startY = 130;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('STUDENT DETAILS', 40, startY);

      const studentData = [
        ['Name:', student.name],
        ['Roll No:', student.rollNo],
        ['Department:', student.department],
        ['Year:', student.year + getOrdinalSuffix(student.year)],
        ['Class:', student.class],
        ['Residence:', student.residenceType === 'day-scholar' ? 'Day Scholar' : 'Hosteller']
      ];

      const labelWidth = 100;
      studentData.forEach((item, index) => {
        const y = startY + 35 + (index * 22);
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(item[0], 40, y, { width: labelWidth });
        doc.fillColor('#374151')
          .font('Helvetica')
          .text(item[1], 40 + labelWidth, y);
      });

      // PASS CODE - ORANGE BLOCK (with gap)
      const codeY = startY + 180;
      const boxWidth = 280;
      const boxHeight = 70;
      const codeX = (pageWidth - boxWidth) / 2;

      doc.fillColor('#fef3c7')
        .roundedRect(codeX, codeY, boxWidth, boxHeight, 8)
        .fill();

      doc.strokeColor('#f59e0b')
        .lineWidth(2)
        .roundedRect(codeX, codeY, boxWidth, boxHeight, 8)
        .stroke();

      const centerY = codeY + (boxHeight / 2);
      doc.fillColor('#92400e')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PASS CODE', codeX, centerY - 15, {
          width: boxWidth,
          align: 'center'
        });

      doc.fillColor('#dc2626')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(passRequest.passCode, codeX, centerY + 2, {
          width: boxWidth,
          align: 'center'
        });

      // PASS DETAILS - NORMAL TEXT COLORS (with gap)
      const detailsY = codeY + 100;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PASS DETAILS', 40, detailsY);

      const passDetails = [
        ['Pass Type:', passRequest.passType.toUpperCase()],
        ['Reason:', passRequest.reason],
        ['Out Time:', passRequest.outTime],
        ['Destination:', passRequest.destination],
        ['Date:', new Date(passRequest.outDate).toLocaleDateString()],
        ['Return Time:', passRequest.expectedReturnTime]
      ];

      const leftColX = 40;
      const rightColX = pageWidth / 2 + 40;
      const detailLabelWidth = 110;

      passDetails.forEach((item, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const baseX = col === 0 ? leftColX : rightColX;
        const y = detailsY + 35 + (row * 25);
        doc.fillColor('#1f2937')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(item[0], baseX, y, { width: detailLabelWidth });
        doc.fillColor('#374151')
          .font('Helvetica')
          .text(item[1], baseX + detailLabelWidth, y);
      });

      // APPROVAL STATUS - NORMAL TEXT COLORS (with gap)
      const approvalY = detailsY + 170;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('APPROVAL STATUS', 40, approvalY);

      const approvalBoxY = approvalY + 35;
      doc.fillColor('#f0f9ff')
        .roundedRect(40, approvalBoxY, pageWidth - 80, 60, 8)
        .fill();

      doc.strokeColor('#3b82f6')
        .lineWidth(2)
        .roundedRect(40, approvalBoxY, pageWidth - 80, 60, 8)
        .stroke();

      doc.fillColor('#1e3a8a')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`APPROVED BY: ${facultyName}`, 40, approvalBoxY + 15, {
          width: pageWidth - 80,
          align: 'center'
        });

      if (passRequest.facultyRemark || passRequest.hodRemark || passRequest.wardenRemark) {
        const remark = passRequest.facultyRemark || passRequest.hodRemark || passRequest.wardenRemark;
        doc.fillColor('#059669')
          .fontSize(12)
          .font('Helvetica-Oblique')
          .text(`"${remark}"`, 40, approvalBoxY + 35, {
            width: pageWidth - 80,
            align: 'center'
          });
      }

      // Footer (with gap)
      const footerY = pageHeight - 50;
      doc.fillColor('#f9fafb')
        .roundedRect(40, footerY, pageWidth - 80, 25, 6)
        .fill();

      doc.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(
          'Generated: ' +
          new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          40,
          footerY + 8,
          { width: pageWidth - 80, align: 'center' }
        );

      // Finalize PDF
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('✅ Single page PDF generated successfully');
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

module.exports = {
  requestPass,
  getPassHistory,
  facultyApprove,
  facultyReject,
  wardenApprove,
  wardenReject,
  hodApprove,
  hodReject,
  verifyPass,
  markExit,
  markReturn,
  getVerificationHistory,
  getPendingPasses,
  deletePass,
  generatePassPDFDynamic
};
