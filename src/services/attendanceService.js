const prisma = require('../config/database');
const logger = require('../utils/logger');

class AttendanceService {
  constructor() {
    this.sseClients = new Set();
    this.activeTimer = null;
  }

  /**
   * Register an SSE client for real-time live attendance streaming
   */
  addSseClient(res) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  /**
   * Broadcast real-time event to all connected admin web panels
   */
  broadcast(eventType, payload) {
    const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(dataString);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  /**
   * Admin yangi 30 soniyalik davomat ochadi
   */
  async createAttendance() {
    // Oldingi har qanday faol davomatni yopish
    await prisma.attendance.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    // 6 xonali tasodifiy bir martalik kod generatsiya qilish
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 30 * 1000); // 30 soniya

    const attendance = await prisma.attendance.create({
      data: {
        code,
        startedAt,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    const totalStudents = await prisma.student.count();

    // 30 soniyadan keyin avtomatik yopish
    this.activeTimer = setTimeout(async () => {
      try {
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { status: 'EXPIRED' },
        });
        const finalDetails = await this.getAttendanceById(attendance.id);
        this.broadcast('attendance_expired', finalDetails);
        logger.info(`Davomat yopildi (30s tugadi). ID: ${attendance.id}`);
      } catch (err) {
        logger.error('Attendance auto-expire error:', err.message);
      }
    }, 30 * 1000);

    const result = {
      id: attendance.id,
      code: attendance.code,
      startedAt: attendance.startedAt,
      expiresAt: attendance.expiresAt,
      durationSeconds: 30,
      remainingSeconds: 30,
      status: 'ACTIVE',
      totalStudents,
      attendedCount: 0,
      absentCount: totalStudents,
      attendedStudents: [],
      absentStudents: [],
    };

    // Live update yuborish
    this.broadcast('attendance_started', result);
    return result;
  }

  /**
   * Hozirgi faol davomat holati va tafsilotlarini olish
   */
  async getActiveAttendance() {
    const active = await prisma.attendance.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        records: {
          include: {
            student: true,
          },
          orderBy: { markedAt: 'asc' },
        },
      },
    });

    if (!active) {
      // Eng so'nggi davomatni qaytarish (agar mavjud bo'lsa)
      const last = await prisma.attendance.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          records: {
            include: {
              student: true,
            },
            orderBy: { markedAt: 'asc' },
          },
        },
      });

      if (!last) {
        const totalStudents = await prisma.student.count();
        return {
          hasActive: false,
          attendance: null,
          totalStudents,
          attendedCount: 0,
          absentCount: totalStudents,
        };
      }

      return this.formatAttendanceDetails(last, false);
    }

    // Vaqt tugaganini tekshirish
    const now = Date.now();
    const expiresAtMs = new Date(active.expiresAt).getTime();
    if (now >= expiresAtMs) {
      await prisma.attendance.update({
        where: { id: active.id },
        data: { status: 'EXPIRED' },
      });
      active.status = 'EXPIRED';
      return this.formatAttendanceDetails(active, false);
    }

    return this.formatAttendanceDetails(active, true);
  }

  /**
   * Talaba Telegram bot orqali kod kiritganda tekshirish va qayd etish
   */
  async markAttendance(telegramUserId, inputCode) {
    if (!telegramUserId) {
      return {
        success: false,
        reason: 'NOT_REGISTERED',
        message: '❌ Siz tizimda ro‘yxatdan o‘tmagansiz.\nAvval ro‘yxatdan o‘tishingiz kerak.',
      };
    }

    // 1. Talaba tizimda bormi?
    const student = await prisma.student.findUnique({
      where: { telegramUserId: String(telegramUserId) },
    });

    if (!student) {
      return {
        success: false,
        reason: 'NOT_REGISTERED',
        message: '❌ Siz tizimda ro‘yxatdan o‘tmagansiz.\nAvval ro‘yxatdan o‘tishingiz kerak.',
      };
    }

    // 2. Faol davomat mavjudmi?
    const active = await prisma.attendance.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) {
      return {
        success: false,
        reason: 'NO_ACTIVE',
        message: '⏰ Davomat vaqti tugagan.',
      };
    }

    // 3. 30 soniya tugaganmi?
    const now = Date.now();
    const expiresAtMs = new Date(active.expiresAt).getTime();
    if (now >= expiresAtMs) {
      await prisma.attendance.update({
        where: { id: active.id },
        data: { status: 'EXPIRED' },
      });
      return {
        success: false,
        reason: 'EXPIRED',
        message: '⏰ Davomat vaqti tugagan.',
      };
    }

    // 4. Kod to'g'rimi?
    const cleanedCode = String(inputCode).trim();
    if (active.code !== cleanedCode) {
      return {
        success: false,
        reason: 'INVALID_CODE',
        message: '❌ Kod noto‘g‘ri.',
      };
    }

    // 5. Ushbu talaba allaqachon o'tganmi?
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        attendanceId_studentId: {
          attendanceId: active.id,
          studentId: student.id,
        },
      },
    });

    if (existingRecord) {
      return {
        success: false,
        reason: 'ALREADY_MARKED',
        message: '✅ Siz ushbu davomatdan allaqachon o‘tgansiz.',
      };
    }

    // 6. Qayd qilish
    const record = await prisma.attendanceRecord.create({
      data: {
        attendanceId: active.id,
        studentId: student.id,
        markedAt: new Date(),
      },
      include: {
        student: true,
      },
    });

    // Real-time admin panelga broadcast yuborish
    const updatedDetails = await this.getAttendanceById(active.id);
    this.broadcast('attendance_updated', {
      ...updatedDetails,
      newRecord: {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fatherName: student.fatherName,
        direction: student.direction,
        phone: student.phone,
        roomNumber: student.roomNumber,
        markedAt: record.markedAt,
      },
    });

    return {
      success: true,
      reason: 'SUCCESS',
      message: '✅ Davomatdan muvaffaqiyatli o‘tdingiz!',
      student,
    };
  }

  /**
   * Bitta davomat bo'yicha to'liq hisobot (Kelganlar va Kelmaganlar ro'yxati bilan)
   */
  async getAttendanceById(id) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        records: {
          include: {
            student: true,
          },
          orderBy: { markedAt: 'asc' },
        },
      },
    });

    if (!attendance) {
      const err = new Error('Davomat topilmadi.');
      err.statusCode = 404;
      err.isCustom = true;
      throw err;
    }

    const isActive = attendance.status === 'ACTIVE' && Date.now() < new Date(attendance.expiresAt).getTime();
    return this.formatAttendanceDetails(attendance, isActive);
  }

  /**
   * Davomat ma'lumotlarini to'liq formatlash yordamchisi
   */
  async formatAttendanceDetails(attendance, isActive) {
    const allStudents = await prisma.student.findMany({
      orderBy: [
        { roomNumber: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    const attendedStudentIds = new Set(attendance.records.map((r) => r.studentId));

    const attendedStudents = attendance.records.map((r, index) => ({
      orderNumber: index + 1,
      id: r.student.id,
      firstName: r.student.firstName,
      lastName: r.student.lastName,
      fatherName: r.student.fatherName,
      direction: r.student.direction,
      phone: r.student.phone,
      roomNumber: r.student.roomNumber,
      markedAt: r.markedAt,
    }));

    const absentStudents = allStudents
      .filter((s) => !attendedStudentIds.has(s.id))
      .map((s, index) => ({
        orderNumber: index + 1,
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        fatherName: s.fatherName,
        direction: s.direction,
        phone: s.phone,
        roomNumber: s.roomNumber,
        status: s.status,
      }));

    const totalStudents = allStudents.length;
    const attendedCount = attendedStudents.length;
    const absentCount = absentStudents.length;

    const remainingSeconds = isActive
      ? Math.max(0, Math.ceil((new Date(attendance.expiresAt).getTime() - Date.now()) / 1000))
      : 0;

    return {
      hasActive: isActive,
      id: attendance.id,
      code: attendance.code,
      startedAt: attendance.startedAt,
      expiresAt: attendance.expiresAt,
      status: isActive ? 'ACTIVE' : 'EXPIRED',
      durationSeconds: 30,
      remainingSeconds,
      totalStudents,
      attendedCount,
      absentCount,
      attendedStudents,
      absentStudents,
    };
  }

  /**
   * Davomatlar tarixi
   */
  async getAttendanceHistory({ page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const [total, attendances] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          records: {
            select: { id: true },
          },
        },
      }),
    ]);

    const totalStudents = await prisma.student.count();

    const formatted = attendances.map((att) => {
      const attendedCount = att.records.length;
      const absentCount = Math.max(0, totalStudents - attendedCount);

      return {
        id: att.id,
        code: att.code,
        startedAt: att.startedAt,
        expiresAt: att.expiresAt,
        status: att.status,
        createdAt: att.createdAt,
        totalStudents,
        attendedCount,
        absentCount,
      };
    });

    return {
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }
}

module.exports = new AttendanceService();
