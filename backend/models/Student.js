const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  residenceType: {
    type: String,
    enum: ['hosteller', 'day-scholar'],
    required: true
  },
  classInchargeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  phone: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    required: true
  },
  violationCount: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
