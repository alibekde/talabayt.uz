const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Real-time live SSE stream (accessible for authorized admin web panels)
router.get('/live-stream', attendanceController.liveStream);

// Active attendance state
router.get('/active', authMiddleware, attendanceController.getActiveAttendance);

// Start a new 30s attendance session
router.post('/start', authMiddleware, attendanceController.startAttendance);

// Attendance history list
router.get('/history', authMiddleware, attendanceController.getAttendanceHistory);

// Single attendance session detail
router.get('/:id', authMiddleware, attendanceController.getAttendanceById);

// Mark attendance (open/authenticated)
router.post('/mark', attendanceController.markAttendance);

module.exports = router;
