const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const { getStudentProfile } = require('../controllers/studentController');

router.get('/profile', auth, authorizeRoles('student'), getStudentProfile);

module.exports = router;
