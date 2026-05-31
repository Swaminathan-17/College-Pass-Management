const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  classes: [{
    classId: String,
    className: String
  }],
  isClassIncharge: {
    type: Boolean,
    default: false
  },
  isHOD: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
