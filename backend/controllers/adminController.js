const PassRequest = require('../models/PassRequest');
const Student = require('../models/Student');
const User = require('../models/User');

const getAnalytics = async (req, res) => {
  try {
    // Total counts
    const totalPasses = await PassRequest.countDocuments();
    const totalStudents = await Student.countDocuments();
    const blockedStudents = await Student.countDocuments({ isBlocked: true });
    const activeStudents = totalStudents - blockedStudents;

    // Pass status counts
    const approvedPasses = await PassRequest.countDocuments({ 
      status: { $in: ['FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED'] }
    });
    const pendingPasses = await PassRequest.countDocuments({ status: 'REQUESTED' });

    // Passes by status
    const passesByStatusRaw = await PassRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const passesByStatus = {};
    passesByStatusRaw.forEach(item => {
      passesByStatus[item._id] = item.count;
    });

    // Passes by type
    const passesByTypeRaw = await PassRequest.aggregate([
      {
        $group: {
          _id: '$passType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const passesByType = {};
    passesByTypeRaw.forEach(item => {
      passesByType[item._id] = item.count;
    });

    // Additional statistics
    const studentsCurrentlyOutside = await PassRequest.countDocuments({ status: 'OUTSIDE' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lateReturns = await PassRequest.countDocuments({
      status: 'RETURNED',
      returnTimeActual: { $gte: today }
    });

    // Average passes per student
    const avgPassesPerStudent = totalStudents > 0 ? Math.round((totalPasses / totalStudents) * 10) / 10 : 0;

    res.json({
      totalStudents,
      totalPasses,
      approvedPasses,
      pendingPasses,
      activeStudents,
      blockedStudents,
      avgPassesPerStudent,
      passesByStatus,
      passesByType,
      studentsCurrentlyOutside,
      lateReturns
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
};

module.exports = { getAnalytics };
