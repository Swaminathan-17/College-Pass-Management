const Faculty = require('../models/Faculty');
const User = require('../models/User');

const getFacultyList = async (req, res) => {
  try {
    const faculty = await Faculty.find({})
      .populate('userId', 'name email')
      .select('userId department designation classes isClassIncharge isHOD');
    
    if (!faculty || faculty.length === 0) {
      return res.json([]);
    }

    const facultyList = faculty
      .filter(f => f.userId) // Filter out faculty with null userId
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

    res.json(facultyList);
  } catch (error) {
    console.error('Error in getFacultyList:', error);
    res.status(500).json({ message: 'Server error while fetching faculty list' });
  }
};

const getFacultyByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const faculty = await Faculty.find({ 
      department,
      isClassIncharge: true 
    })
      .populate('userId', 'name email')
      .select('userId department designation classes');

    const facultyList = faculty.map(f => ({
      _id: f._id,
      name: f.userId.name,
      email: f.userId.email,
      department: f.department,
      designation: f.designation,
      classes: f.classes
    }));

    res.json(facultyList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({
      _id: faculty._id,
      name: faculty.userId.name,
      email: faculty.userId.email,
      department: faculty.department,
      designation: faculty.designation,
      classes: faculty.classes,
      isClassIncharge: faculty.isClassIncharge,
      isHOD: faculty.isHOD
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateFacultyProfile = async (req, res) => {
  try {
    const { department, designation, classes, isClassIncharge } = req.body;
    
    const faculty = await Faculty.findOneAndUpdate(
      { userId: req.user.id },
      { department, designation, classes, isClassIncharge },
      { new: true, upsert: true }
    ).populate('userId', 'name email');

    res.json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFacultyList,
  getFacultyById,
  updateFacultyProfile,
  getFacultyByDepartment
};
