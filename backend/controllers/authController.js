const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const register = async (req, res) => {
  try {
    const { name, email, password, role, studentDetails, facultyDetails } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    if (role === 'student' && studentDetails) {
      const student = new Student({
        userId: user._id,
        ...studentDetails
      });
      await student.save();
    } else if (role === 'faculty' && facultyDetails) {
      const faculty = new Faculty({
        userId: user._id,
        ...facultyDetails,
        isClassIncharge: true // Set to true for testing
      });
      await faculty.save();
    }

    const payload = {
      id: user._id,
      role: user.role
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      role: user.role
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
