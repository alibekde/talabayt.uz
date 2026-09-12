const reportService = require('../services/reportService');
const googleSheetsService = require('../services/googleSheetsService');
const studentService = require('../services/studentService');

class ReportController {
  // GET /reports - Room-grouped summary
  async getReportsSummary(req, res, next) {
    try {
      const summary = await studentService.getGroupedRoomReport();
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/pdf - PDF download
  async downloadPDF(req, res, next) {
    try {
      const pdfBuffer = await reportService.generatePDF();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="yotoqxona_talabalari_${Date.now()}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  // GET /reports/excel - Excel download
  async downloadExcel(req, res, next) {
    try {
      const excelBuffer = await reportService.generateExcel();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="yotoqxona_talabalari_${Date.now()}.xlsx"`
      );
      res.setHeader('Content-Length', excelBuffer.length);
      return res.end(excelBuffer);
    } catch (error) {
      next(error);
    }
  }

  // POST /reports/google-sheets - Google Sheets Export
  async exportGoogleSheets(req, res, next) {
    try {
      const result = await googleSheetsService.exportToGoogleSheets();
      return res.status(200).json({
        success: true,
        message: 'Ma\'lumotlar Google Sheets jadvaliga muvaffaqiyatli eksport qilindi.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
