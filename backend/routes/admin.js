const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/adminController');

router.get('/analytics', auth, authorizeRoles('admin'), getAnalytics);

module.exports = router;
