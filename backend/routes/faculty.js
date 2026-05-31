const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const {
  getFacultyList,
  getFacultyById,
  updateFacultyProfile,
  getFacultyByDepartment
} = require('../controllers/facultyController');

router.get('/list', getFacultyList);
router.get('/department/:department', auth, getFacultyByDepartment);
router.get('/:id', auth, getFacultyById);
router.put('/profile', auth, authorizeRoles('faculty'), updateFacultyProfile);

module.exports = router;
