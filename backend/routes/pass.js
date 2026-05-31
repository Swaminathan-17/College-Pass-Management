const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const {
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
} = require('../controllers/passController');

router.post('/request', auth, authorizeRoles('student'), requestPass);
router.get('/history', auth, authorizeRoles('student'), getPassHistory);
router.delete('/:id', auth, authorizeRoles('student'), deletePass);
router.put('/faculty-approve/:id', auth, authorizeRoles('faculty'), facultyApprove);
router.put('/faculty-reject/:id', auth, authorizeRoles('faculty'), facultyReject);
router.put('/hod-approve/:id', auth, authorizeRoles('faculty'), hodApprove);
router.put('/hod-reject/:id', auth, authorizeRoles('faculty'), hodReject);
router.put('/warden-approve/:id', auth, authorizeRoles('warden'), wardenApprove);
router.put('/warden-reject/:id', auth, authorizeRoles('warden'), wardenReject);
router.post('/verify', auth, authorizeRoles('security'), verifyPass);
router.put('/exit/:id', auth, authorizeRoles('security'), markExit);
router.put('/return/:id', auth, authorizeRoles('security'), markReturn);
router.get('/verification-history', auth, authorizeRoles('security'), getVerificationHistory);
router.get('/pending', auth, authorizeRoles('faculty', 'warden'), getPendingPasses);
router.get('/pdf/:id', auth, generatePassPDFDynamic);
router.get('/pdf-test/:id', generatePassPDFDynamic); // Temporary test route without auth

module.exports = router;
