const studentService = require('../services/studentService');

class StudentController {
  // GET /students - Paginated list
  async getStudents(req, res, next) {
    try {
      const { page, limit, search, roomNumber, status } = req.query;
      const result = await studentService.getAllStudents({
        page,
        limit,
        search,
        roomNumber,
        status,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/search
  async searchStudents(req, res, next) {
    try {
      const { q, page, limit } = req.query;
      const result = await studentService.getAllStudents({
        page,
        limit,
        search: q || '',
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/stats - Dashboard stats
  async getStats(req, res, next) {
    try {
      const stats = await studentService.getDashboardStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/rooms - Rooms overview (patoklar / grid)
  async getRoomsOverview(req, res, next) {
    try {
      const { floor } = req.query;
      const data = await studentService.getRoomsOverview(floor);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/rooms/:roomNumber - Single room details (e.g. 420-xona)
  async getRoomDetails(req, res, next) {
    try {
      const { roomNumber } = req.params;
      const data = await studentService.getRoomDetails(roomNumber);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /students/logs - Movement logs history
  async getMovementLogs(req, res, next) {
    try {
      const { page, limit, type } = req.query;
      const result = await studentService.getMovementLogs({ page, limit, type });
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /students/:id/movement - Kirib ketdi / Chiqib ketdi
  async toggleMovement(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const result = await studentService.toggleMovement(id, status, note);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /students/:id
  async getStudentById(req, res, next) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      return res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /students - Create student
  async createStudent(req, res, next) {
    try {
      const student = await studentService.createStudent(req.body);
      return res.status(201).json({
        success: true,
        message: 'Talaba muvaffaqiyatli saqlandi.',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /students/:id - Update student
  async updateStudent(req, res, next) {
    try {
      const student = await studentService.updateStudent(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Talaba ma\'lumotlari muvaffaqiyatli yangilandi.',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /students/:id - Delete student
  async deleteStudent(req, res, next) {
    try {
      const result = await studentService.deleteStudent(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
