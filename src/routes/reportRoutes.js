const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, reportController.getReportsSummary);
router.get('/pdf', authMiddleware, reportController.downloadPDF);
router.get('/excel', authMiddleware, reportController.downloadExcel);
router.post('/google-sheets', authMiddleware, reportController.exportGoogleSheets);

module.exports = router;
