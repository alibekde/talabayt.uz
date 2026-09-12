const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

// Dashboard statistics
router.get('/stats', authMiddleware, studentController.getStats);

// Search endpoint
router.get('/search', authMiddleware, studentController.searchStudents);

// Rooms overview & details (Patoklar)
router.get('/rooms', authMiddleware, studentController.getRoomsOverview);
router.get('/rooms/:roomNumber', authMiddleware, studentController.getRoomDetails);

// Movement history & toggle (Kirib ketdi / Chiqib ketdi)
router.get('/logs', authMiddleware, studentController.getMovementLogs);
router.post('/:id/movement', authMiddleware, studentController.toggleMovement);

// Main CRUD endpoints
router.get('/', authMiddleware, studentController.getStudents);
router.post('/', authMiddleware, studentController.createStudent);
router.get('/:id', authMiddleware, studentController.getStudentById);
router.patch('/:id', authMiddleware, studentController.updateStudent);
router.delete('/:id', authMiddleware, studentController.deleteStudent);

module.exports = router;
