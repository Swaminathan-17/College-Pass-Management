const mongoose = require('mongoose');

const securityVerificationSchema = new mongoose.Schema({
  passRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PassRequest',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  securityPersonnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationType: {
    type: String,
    enum: ['VERIFY', 'CHECK_OUT', 'CHECK_IN'],
    required: true
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  passDetails: {
    passCode: String,
    passType: String,
    destination: String,
    outDate: Date,
    outTime: String,
    expectedReturnTime: String,
    reason: String,
    status: String
  },
  approvalDetails: {
    facultyName: String,
    facultyRemark: String,
    hodName: String,
    hodRemark: String,
    wardenName: String,
    wardenRemark: String
  },
  studentDetails: {
    rollNo: String,
    name: String,
    department: String,
    year: String,
    phone: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
securityVerificationSchema.index({ verifiedAt: -1 });
securityVerificationSchema.index({ student: 1, verifiedAt: -1 });
securityVerificationSchema.index({ verificationType: 1, verifiedAt: -1 });

module.exports = mongoose.model('SecurityVerification', securityVerificationSchema);
