const mongoose = require('mongoose');

const passRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  assignedFacultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  assignedHodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  passType: {
    type: String,
    enum: ['home', 'medical', 'personal', 'official', 'other', 'emergency', 'express'],
    required: true
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  isExpress: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  outDate: {
    type: Date,
    required: true
  },
  outTime: {
    type: String,
    required: true
  },
  expectedReturnTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED', 'REJECTED', 'OUTSIDE', 'RETURNED'],
    default: 'REQUESTED'
  },
  passCode: {
    type: String,
    unique: true,
    sparse: true
  },
  facultyRemark: {
    type: String
  },
  hodRemark: {
    type: String
  },
  wardenRemark: {
    type: String
  },
  exitTime: {
    type: Date
  },
  returnTimeActual: {
    type: Date
  },
  pdfUrl: {
    type: String
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PassRequest', passRequestSchema);
