const prisma = require('../config/database');
const { normalizePhoneNumber, parseRoomNumber, studentCreateSchema } = require('../utils/validation');
const notificationService = require('./notificationService');

class StudentService {
  /**
   * Talabalarni sahifalab, status va qidiruv bo'yicha olish
   */
  async getAllStudents({ page = 1, limit = 20, search = '', roomNumber = null, status = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (status && (status === 'INSIDE' || status === 'OUTSIDE')) {
      where.status = status;
    }

    if (roomNumber !== null && roomNumber !== undefined && roomNumber !== '') {
      const parsedRoom = parseInt(roomNumber, 10);
      if (!isNaN(parsedRoom)) {
        where.roomNumber = parsedRoom;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const numQuery = parseInt(q, 10);
      const orConditions = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { fatherName: { contains: q, mode: 'insensitive' } },
        { direction: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];

      if (!isNaN(numQuery)) {
        orConditions.push({ roomNumber: numQuery });
      }

      where.OR = orConditions;
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: [
          { roomNumber: 'asc' },
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      }),
    ]);

    return {
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Bitta talaba ma'lumotini ID bo'yicha olish
   */
  async getStudentById(id) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        movementLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!student) {
      const error = new Error('Talaba topilmadi.');
      error.statusCode = 404;
      error.isCustom = true;
      throw error;
    }
    return student;
  }

  /**
   * Yangi talaba qo'shish (duplikat tekshiruvi bilan)
   */
  async createStudent(rawData) {
    const validated = studentCreateSchema.parse(rawData);
    const normalizedPhone = normalizePhoneNumber(validated.phone);
    const parsedRoom = parseRoomNumber(validated.roomNumber);

    if (!normalizedPhone) {
      const err = new Error("Telefon raqami noto'g'ri.");
      err.statusCode = 400;
      err.isCustom = true;
      throw err;
    }

    if (!parsedRoom) {
      const err = new Error("Xona raqami noto'g'ri.");
      err.statusCode = 400;
      err.isCustom = true;
      throw err;
    }

    // Telegram user ID orqali bitta foydalanuvchi faqat 1 marta ro'yxatdan o'tishi tekshiruvi
    if (validated.telegramUserId) {
      const existingTg = await prisma.student.findUnique({
        where: { telegramUserId: String(validated.telegramUserId) },
      });
      if (existingTg) {
        const error = new Error('⚠️ Siz allaqachon ro‘yxatdan o‘tgansiz. Sizning ma’lumotlaringiz tizimda mavjud.');
        error.statusCode = 409;
        error.isCustom = true;
        throw error;
      }
    }

    // Duplikat tekshirish: firstName + lastName + fatherName + phone
    const existing = await prisma.student.findFirst({
      where: {
        firstName: { equals: validated.firstName.trim(), mode: 'insensitive' },
        lastName: { equals: validated.lastName.trim(), mode: 'insensitive' },
        fatherName: { equals: validated.fatherName.trim(), mode: 'insensitive' },
        phone: normalizedPhone,
      },
    });

    if (existing) {
      const error = new Error('⚠️ Ushbu talaba tizimda allaqachon mavjud.');
      error.statusCode = 409;
      error.isCustom = true;
      throw error;
    }

    // 1 ta xonada ko'pi bilan 3 ta talaba bo'lishi shart
    const currentRoomCount = await prisma.student.count({
      where: { roomNumber: parsedRoom },
    });

    if (currentRoomCount >= 3) {
      const error = new Error('❌ Bu xona to‘liq band. Xonada maksimal 3 ta talaba bo‘lishi mumkin.');
      error.statusCode = 400;
      error.isCustom = true;
      throw error;
    }

    const newStudent = await prisma.student.create({
      data: {
        telegramUserId: validated.telegramUserId ? String(validated.telegramUserId) : null,
        firstName: validated.firstName.trim(),
        lastName: validated.lastName.trim(),
        fatherName: validated.fatherName.trim(),
        direction: validated.direction.trim(),
        phone: normalizedPhone,
        roomNumber: parsedRoom,
        status: 'INSIDE',
        lastMovementAt: new Date(),
      },
    });

    // Boshlang'ich kirdi logi
    await prisma.movementLog.create({
      data: {
        studentId: newStudent.id,
        type: 'CHECK_IN',
        note: 'Dastlabki ro\'yxatga olish',
      },
    });

    // Telegram adminlarga bildirishnoma yuborish
    try {
      notificationService.notifyNewStudent(newStudent, 'Web Panel');
    } catch (err) {}

    return newStudent;
  }

  /**
   * Talaba ma'lumotlarini tahrirlash
   */
  async updateStudent(id, rawData) {
    await this.getStudentById(id);

    const updateData = {};
    if (rawData.firstName) updateData.firstName = rawData.firstName.trim();
    if (rawData.lastName) updateData.lastName = rawData.lastName.trim();
    if (rawData.fatherName) updateData.fatherName = rawData.fatherName.trim();
    if (rawData.direction) updateData.direction = rawData.direction.trim();
    if (rawData.telegramUserId !== undefined) {
      updateData.telegramUserId = rawData.telegramUserId ? String(rawData.telegramUserId) : null;
    }

    if (rawData.phone) {
      const normalizedPhone = normalizePhoneNumber(rawData.phone);
      if (!normalizedPhone) {
        const err = new Error("Telefon raqami noto'g'ri.");
        err.statusCode = 400;
        err.isCustom = true;
        throw err;
      }
      updateData.phone = normalizedPhone;
    }

    if (rawData.roomNumber !== undefined) {
      const parsedRoom = parseRoomNumber(rawData.roomNumber);
      if (!parsedRoom) {
        const err = new Error("Xona raqami noto'g'ri.");
        err.statusCode = 400;
        err.isCustom = true;
        throw err;
      }

      const current = await this.getStudentById(id);
      if (parsedRoom !== current.roomNumber) {
        const targetRoomCount = await prisma.student.count({
          where: { roomNumber: parsedRoom },
        });
        if (targetRoomCount >= 3) {
          const err = new Error('❌ Bu xona to‘liq band. Xonada maksimal 3 ta talaba bo‘lishi mumkin.');
          err.statusCode = 400;
          err.isCustom = true;
          throw err;
        }
      }

      updateData.roomNumber = parsedRoom;
    }

    if (rawData.status && (rawData.status === 'INSIDE' || rawData.status === 'OUTSIDE')) {
      updateData.status = rawData.status;
      updateData.lastMovementAt = new Date();
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Talabani o'chirish
   */
  async deleteStudent(id) {
    const student = await this.getStudentById(id);
    await prisma.student.delete({
      where: { id },
    });

    try {
      notificationService.notifyStudentDeleted(student, 'Web Panel');
    } catch (err) {}

    return { success: true, message: 'Talaba tizimdan muvaffaqiyatli o\'chirildi.' };
  }

  /**
   * Talabaning kirish / chiqish holatini o'zgartirish (Kirib ketdi / Chiqib ketdi)
   */
  async toggleMovement(studentId, targetStatus = null, note = '') {
    const student = await this.getStudentById(studentId);
    const newStatus = targetStatus || (student.status === 'INSIDE' ? 'OUTSIDE' : 'INSIDE');
    const movementType = newStatus === 'INSIDE' ? 'CHECK_IN' : 'CHECK_OUT';

    const [updatedStudent] = await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: {
          status: newStatus,
          lastMovementAt: new Date(),
        },
      }),
      prisma.movementLog.create({
        data: {
          studentId,
          type: movementType,
          note: note || (newStatus === 'INSIDE' ? 'Xonaga kirdi' : 'Xonadan chiqdi'),
        },
      }),
    ]);

    try {
      notificationService.notifyMovement(updatedStudent, newStatus, 'Web Panel');
    } catch (err) {}

    return {
      success: true,
      student: updatedStudent,
      movementType,
      message: newStatus === 'INSIDE' ? 'Talaba yotoqxonaga kirgan deb belgilandi.' : 'Talaba yotoqxonadan chiqqan deb belgilandi.',
    };
  }

  /**
   * Kirish-chiqish harakatlari tarixi (Movement Logs)
   */
  async getMovementLogs({ page = 1, limit = 30, type = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * take;

    const where = {};
    if (type && (type === 'CHECK_IN' || type === 'CHECK_OUT')) {
      where.type = type;
    }

    const [total, logs] = await Promise.all([
      prisma.movementLog.count({ where }),
      prisma.movementLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fatherName: true,
              direction: true,
              phone: true,
              roomNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Xonalar (Patoklar) umumiy ro'yxati (Grid view uchun)
   */
  async getRoomsOverview(floorFilter = null) {
    const students = await prisma.student.findMany({
      orderBy: [
        { roomNumber: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    const roomsMap = new Map();
    const STANDARD_CAPACITY = 3; // Har bir xona uchun 3 ta o'rin

    for (const st of students) {
      if (!roomsMap.has(st.roomNumber)) {
        const floorNum = Math.floor(st.roomNumber / 100) || 1;
        roomsMap.set(st.roomNumber, {
          roomNumber: st.roomNumber,
          floor: floorNum,
          capacity: STANDARD_CAPACITY,
          totalStudents: 0,
          insideCount: 0,
          outsideCount: 0,
          freeSlots: STANDARD_CAPACITY,
          isFull: false,
          students: [],
        });
      }

      const roomData = roomsMap.get(st.roomNumber);
      roomData.totalStudents += 1;
      roomData.freeSlots = Math.max(0, STANDARD_CAPACITY - roomData.totalStudents);
      roomData.isFull = roomData.totalStudents >= STANDARD_CAPACITY;

      if (st.status === 'INSIDE') {
        roomData.insideCount += 1;
      } else {
        roomData.outsideCount += 1;
      }
      roomData.students.push({
        id: st.id,
        firstName: st.firstName,
        lastName: st.lastName,
        fatherName: st.fatherName,
        direction: st.direction,
        phone: st.phone,
        status: st.status,
        lastMovementAt: st.lastMovementAt,
      });
    }

    let rooms = Array.from(roomsMap.values());

    if (floorFilter !== null && floorFilter !== undefined && floorFilter !== '') {
      const parsedFloor = parseInt(floorFilter, 10);
      if (!isNaN(parsedFloor)) {
        rooms = rooms.filter((r) => r.floor === parsedFloor);
      }
    }

    return {
      totalRooms: rooms.length,
      rooms,
    };
  }

  /**
   * Aniq bitta xonaga kirilganda (masalan, 420-xona)
   */
  async getRoomDetails(roomNumber) {
    const parsedRoom = parseInt(roomNumber, 10);
    if (isNaN(parsedRoom)) {
      const err = new Error('Xona raqami noto\'g\'ri.');
      err.statusCode = 400;
      err.isCustom = true;
      throw err;
    }

    const students = await prisma.student.findMany({
      where: { roomNumber: parsedRoom },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    const floor = Math.floor(parsedRoom / 100) || 1;
    const capacity = 3;
    const insideCount = students.filter((s) => s.status === 'INSIDE').length;
    const outsideCount = students.filter((s) => s.status === 'OUTSIDE').length;

    return {
      roomNumber: parsedRoom,
      floor,
      capacity,
      totalStudents: students.length,
      freeSlots: Math.max(0, capacity - students.length),
      isFull: students.length >= capacity,
      insideCount,
      outsideCount,
      students,
    };
  }

  /**
   * Dashboard statistikasi va grafiklar uchun tahliliy ma'lumotlar
   */
  async getDashboardStats() {
    const [totalStudents, insideStudents, outsideStudents, roomGroups, directionGroups, allStudents] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'INSIDE' } }),
      prisma.student.count({ where: { status: 'OUTSIDE' } }),
      prisma.student.groupBy({
        by: ['roomNumber'],
        _count: { id: true },
        orderBy: { roomNumber: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['direction'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      }),
      prisma.student.findMany({
        select: { roomNumber: true, status: true },
      }),
    ]);

    const totalRooms = roomGroups.length;
    const totalCapacity = totalRooms * 3;
    const freeSlots = Math.max(0, totalCapacity - totalStudents);

    // Qavatlar bo'yicha guruhlash (1-qavat, 2-qavat, 3-qavat, 4-qavat, 5-qavat)
    const floorMap = new Map();
    for (let f = 1; f <= 5; f++) {
      floorMap.set(f, { floor: `${f}-qavat`, students: 0, inside: 0, outside: 0, roomsCount: 0 });
    }

    roomGroups.forEach((r) => {
      const fNum = Math.floor(r.roomNumber / 100) || 1;
      if (floorMap.has(fNum)) {
        floorMap.get(fNum).roomsCount += 1;
      }
    });

    allStudents.forEach((st) => {
      const fNum = Math.floor(st.roomNumber / 100) || 1;
      if (floorMap.has(fNum)) {
        const fData = floorMap.get(fNum);
        fData.students += 1;
        if (st.status === 'INSIDE') {
          fData.inside += 1;
        } else {
          fData.outside += 1;
        }
      }
    });

    const floorStats = Array.from(floorMap.values()).filter((f) => f.students > 0 || f.roomsCount > 0);

    const directionStats = directionGroups.map((d) => ({
      name: d.direction,
      count: d._count.id,
    }));

    return {
      totalStudents,
      insideStudents,
      outsideStudents,
      totalRooms,
      totalCapacity,
      freeSlots,
      occupancyRate: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
      floorStats,
      directionStats,
      movementStats: [
        { name: 'Yotoqxonada', value: insideStudents, color: '#10b981' },
        { name: 'Tashqarida', value: outsideStudents, color: '#ef4444' },
      ],
      roomStats: roomGroups.map((r) => ({
        roomNumber: r.roomNumber,
        count: r._count.id,
        floor: Math.floor(r.roomNumber / 100) || 1,
      })),
    };
  }

  /**
   * Barcha talabalarni xonalar bo'yicha guruhlangan hisobot shaklida olish
   */
  async getGroupedRoomReport() {
    const students = await prisma.student.findMany({
      orderBy: [
        { roomNumber: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        totalRooms: 0,
        rooms: [],
      };
    }

    const roomsMap = new Map();

    for (const st of students) {
      if (!roomsMap.has(st.roomNumber)) {
        roomsMap.set(st.roomNumber, []);
      }
      roomsMap.get(st.roomNumber).push(st);
    }

    const rooms = [];
    for (const [roomNumber, roomStudents] of roomsMap.entries()) {
      rooms.push({
        roomNumber,
        studentsCount: roomStudents.length,
        students: roomStudents.map((s, idx) => ({
          orderNumber: idx + 1,
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          fatherName: s.fatherName,
          direction: s.direction,
          phone: s.phone,
          roomNumber: s.roomNumber,
          status: s.status,
          lastMovementAt: s.lastMovementAt,
          createdAt: s.createdAt,
        })),
      });
    }

    return {
      totalStudents,
      totalRooms: rooms.length,
      rooms,
    };
  }
}

module.exports = new StudentService();
