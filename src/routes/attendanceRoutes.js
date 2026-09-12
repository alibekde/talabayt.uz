const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Real-time live SSE stream (accessible for authorized admin web panels)
router.get('/live-stream', attendanceController.liveStream);

// Active attendance state
router.get('/active', authMiddleware, attendanceController.getActiveAttendance);
router.get('/current', authMiddleware, attendanceController.getActiveAttendance);

// Start a new 30s attendance session
router.post('/', authMiddleware, attendanceController.startAttendance);
router.post('/start', authMiddleware, attendanceController.startAttendance);

// Close active attendance manually
router.post('/close', authMiddleware, attendanceController.closeAttendance);
router.post('/:id/close', authMiddleware, attendanceController.closeAttendance);

// Attendance history list
router.get('/history', authMiddleware, attendanceController.getAttendanceHistory);

// Single attendance session detail, present list & absent list
router.get('/:id', authMiddleware, attendanceController.getAttendanceById);
router.get('/:id/present', authMiddleware, attendanceController.getAttendancePresent);
router.get('/:id/absent', authMiddleware, attendanceController.getAttendanceAbsent);

// Mark attendance (open/authenticated)
router.post('/mark', attendanceController.markAttendance);
router.post('/:id/check', attendanceController.markAttendance);

module.exports = router;
