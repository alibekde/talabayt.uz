const attendanceService = require('../services/attendanceService');
const logger = require('../utils/logger');

class AttendanceController {
  /**
   * POST /api/attendance/start
   * Yangi 30 soniyalik davomat ochish (Faqat Admin)
   */
  async startAttendance(req, res, next) {
    try {
      const result = await attendanceService.createAttendance();
      res.status(201).json({
        success: true,
        message: 'Yangi davomat muvaffaqiyatli ochildi.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/close yoki POST /api/attendance/:id/close
   * Davomatni qo'lda yopish (Faqat Admin)
   */
  async closeAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const result = await attendanceService.closeAttendance(id);
      res.status(200).json({
        success: true,
        message: 'Davomat muvaffaqiyatli yopildi.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/active
   * Hozirgi faol davomat holatini olish
   */
  async getActiveAttendance(req, res, next) {
    try {
      const data = await attendanceService.getActiveAttendance();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/history
   * Davomatlar tarixi
   */
  async getAttendanceHistory(req, res, next) {
    try {
      const { page, limit } = req.query;
      const history = await attendanceService.getAttendanceHistory({ page, limit });
      res.status(200).json({
        success: true,
        data: history.data,
        pagination: history.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/:id
   * Bitta davomat bo'yicha to'liq hisobot (Kelganlar va Kelmaganlar ro'yxati)
   */
  async getAttendanceById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await attendanceService.getAttendanceById(id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/:id/present
   */
  async getAttendancePresent(req, res, next) {
    try {
      const { id } = req.params;
      const data = await attendanceService.getAttendanceById(id);
      res.status(200).json({
        success: true,
        data: data.attendedStudents,
        total: data.attendedCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/:id/absent
   */
  async getAttendanceAbsent(req, res, next) {
    try {
      const { id } = req.params;
      const data = await attendanceService.getAttendanceById(id);
      res.status(200).json({
        success: true,
        data: data.absentStudents,
        total: data.absentCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/mark yoki POST /api/attendance/:id/check
   * Talaba davomatdan o'tishi (Web/API orqali sinash yoki integratsiya uchun)
   */
  async markAttendance(req, res, next) {
    try {
      const { telegramUserId, code } = req.body;
      const result = await attendanceService.markAttendance(telegramUserId, code);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          reason: result.reason,
          message: result.message,
        });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/live-stream
   * Real-time Server-Sent Events (SSE) oqimi
   */
  async liveStream(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx proxy buffering disable
    res.flushHeaders();

    attendanceService.addSseClient(res);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

    // Keep-alive heartbeat interval every 15s
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  }
}

module.exports = new AttendanceController();
