const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('userId', 'name email')
      .populate('classInchargeId', 'name designation department');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudentProfile
};
