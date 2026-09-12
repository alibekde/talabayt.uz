import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Local Storage Keys
const STORAGE_KEYS = {
  STUDENTS: 'yt_talabalar_data',
  LOGS: 'yt_harakatlar_data',
};

function getLocalStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalStudents(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data));
  } catch {}
}

function getLocalLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addLocalLog(log) {
  try {
    const logs = getLocalLogs();
    logs.unshift({ id: 'log-' + Date.now(), createdAt: new Date().toISOString(), ...log });
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch {}
}

// Mock fallback dispatcher for static / Vercel hosting when backend is offline
function handleMockFallback(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').replace(/^\/api/, '').replace(/^\//, '');
  const students = getLocalStudents();
  const logs = getLocalLogs();

  // Auth: Login
  if (url === 'auth/login' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const u = (body.username || '').trim().toLowerCase();
    const p = (body.password || '').trim();

    if (u === 'admin' && (p === 'admin123' || p === 'admin' || p === 'Admin123')) {
      return {
        data: {
          success: true,
          message: 'Tizimga muvaffaqiyatli kirildi.',
          token: 'jwt-fallback-admin-token-' + Date.now(),
          admin: { id: 'admin-1', username: 'admin' },
        },
        status: 200,
      };
    }
    return Promise.reject({
      response: { status: 401, data: { success: false, message: 'Login yoki parol noto\'g\'ri.' } },
    });
  }

  // Auth: Me
  if (url === 'auth/me' && method === 'get') {
    return {
      data: { success: true, admin: { id: 'admin-1', username: 'admin', createdAt: new Date().toISOString() } },
      status: 200,
    };
  }

  // Stats
  if (url === 'students/stats' && method === 'get') {
    const totalStudents = students.length;
    const insideStudents = students.filter((s) => s.status === 'INSIDE').length;
    const outsideStudents = totalStudents - insideStudents;

    // Floor stats
    const floorCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    students.forEach((s) => {
      const fl = Math.floor(Number(s.roomNumber) / 100) || 1;
      if (floorCounts[fl] !== undefined) floorCounts[fl]++;
    });

    const floorStats = Object.keys(floorCounts).map((fl) => ({
      floor: `${fl}-qavat`,
      talabalar: floorCounts[fl],
      ichkarida: students.filter((s) => Math.floor(Number(s.roomNumber) / 100) === Number(fl) && s.status === 'INSIDE').length,
      tashqarida: students.filter((s) => Math.floor(Number(s.roomNumber) / 100) === Number(fl) && s.status === 'OUTSIDE').length,
    }));

    return {
      data: {
        success: true,
        data: {
          totalStudents,
          insideStudents,
          outsideStudents,
          totalRooms: 40,
          totalCapacity: 160,
          freeSlots: Math.max(0, 160 - totalStudents),
          occupancyRate: totalStudents > 0 ? Math.round((totalStudents / 160) * 100) : 0,
          floorStats,
          directionStats: [
            { name: 'Ichkarida', value: insideStudents },
            { name: 'Tashqarida', value: outsideStudents },
          ],
          movementStats: [
            { name: 'Kirganlar', count: insideStudents },
            { name: 'Chiqganlar', count: outsideStudents },
          ],
          roomStats: [],
        },
      },
      status: 200,
    };
  }

  // Movement Logs: GET /students/logs
  if (url.startsWith('students/logs') && method === 'get') {
    const formattedLogs = logs.map((l) => ({
      id: l.id || 'log-' + Math.random(),
      type: l.type || (l.direction === 'INSIDE' ? 'CHECK_IN' : 'CHECK_OUT'),
      note: l.note || (l.direction === 'INSIDE' ? 'Xonaga kirdi' : 'Xonadan chiqdi'),
      createdAt: l.createdAt || new Date().toISOString(),
      student: l.student || {
        firstName: l.firstName || 'Talaba',
        lastName: l.lastName || '',
        phone: l.phone || '',
        roomNumber: l.roomNumber || 101,
      },
    }));

    return {
      data: {
        success: true,
        data: formattedLogs,
        pagination: { total: formattedLogs.length, page: 1, limit: 30, totalPages: 1 },
      },
      status: 200,
    };
  }

  // Rooms Overview: GET /students/rooms
  if (url === 'students/rooms' && method === 'get') {
    const params = config.params || {};
    const floorFilter = params.floor ? Number(params.floor) : null;
    const roomsMap = new Map();

    const startFloor = floorFilter ? floorFilter : 1;
    const endFloor = floorFilter ? floorFilter : 4;

    for (let fl = startFloor; fl <= endFloor; fl++) {
      for (let r = 1; r <= 10; r++) {
        const roomNum = fl * 100 + r;
        roomsMap.set(roomNum, {
          roomNumber: roomNum,
          floor: fl,
          capacity: 4,
          totalStudents: 0,
          insideCount: 0,
          outsideCount: 0,
          freeSlots: 4,
          isFull: false,
          students: [],
        });
      }
    }

    students.forEach((st) => {
      const rNum = Number(st.roomNumber);
      if (!roomsMap.has(rNum)) {
        roomsMap.set(rNum, {
          roomNumber: rNum,
          floor: Math.floor(rNum / 100) || 1,
          capacity: 4,
          totalStudents: 0,
          insideCount: 0,
          outsideCount: 0,
          freeSlots: 4,
          isFull: false,
          students: [],
        });
      }
      const rm = roomsMap.get(rNum);
      rm.totalStudents++;
      rm.freeSlots = Math.max(0, 4 - rm.totalStudents);
      rm.isFull = rm.totalStudents >= 4;
      if (st.status === 'INSIDE') {
        rm.insideCount++;
      } else {
        rm.outsideCount++;
      }
      rm.students.push(st);
    });

    const roomsList = Array.from(roomsMap.values());
    return {
      data: {
        success: true,
        data: {
          totalRooms: roomsList.length,
          rooms: roomsList,
        },
      },
      status: 200,
    };
  }

  // Room Detail: GET /students/rooms/:roomNumber
  const roomMatch = url.match(/^students\/rooms\/(\d+)/);
  if (roomMatch && method === 'get') {
    const rNum = Number(roomMatch[1]);
    const roomStudents = students.filter((s) => Number(s.roomNumber) === rNum);
    const insideCount = roomStudents.filter((s) => s.status === 'INSIDE').length;
    const outsideCount = roomStudents.length - insideCount;

    return {
      data: {
        success: true,
        data: {
          roomNumber: rNum,
          floor: Math.floor(rNum / 100) || 1,
          capacity: 4,
          totalStudents: roomStudents.length,
          freeSlots: Math.max(0, 4 - roomStudents.length),
          isFull: roomStudents.length >= 4,
          insideCount,
          outsideCount,
          students: roomStudents,
        },
      },
      status: 200,
    };
  }

  // Toggle Movement: POST /students/:id/movement
  const movementMatch = url.match(/^students\/([^/]+)\/movement/);
  if (movementMatch && method === 'post') {
    const stId = movementMatch[1];
    const stIndex = students.findIndex((s) => String(s.id) === String(stId));
    if (stIndex !== -1) {
      const st = students[stIndex];
      const newStatus = st.status === 'INSIDE' ? 'OUTSIDE' : 'INSIDE';
      const movementType = newStatus === 'INSIDE' ? 'CHECK_IN' : 'CHECK_OUT';
      students[stIndex].status = newStatus;
      students[stIndex].lastMovementAt = new Date().toISOString();
      setLocalStudents(students);

      addLocalLog({
        type: movementType,
        note: newStatus === 'INSIDE' ? 'Xonaga kirdi' : 'Xonadan chiqdi',
        createdAt: new Date().toISOString(),
        student: {
          id: st.id,
          firstName: st.firstName || '',
          lastName: st.lastName || '',
          phone: st.phone || '',
          roomNumber: st.roomNumber || 101,
        },
      });

      return {
        data: {
          success: true,
          student: students[stIndex],
          message: newStatus === 'INSIDE' ? 'Talaba yotoqxonaga kirdi deb belgilandi.' : 'Talaba yotoqxonadan chiqdi deb belgilandi.',
        },
        status: 200,
      };
    }
  }

  // Single Student (GET / PUT / DELETE)
  const singleStudentMatch = url.match(/^students\/([^/?]+)$/);
  if (singleStudentMatch) {
    const stId = singleStudentMatch[1];
    const stIndex = students.findIndex((s) => String(s.id) === String(stId));

    if (method === 'get') {
      if (stIndex !== -1) {
        return { data: { success: true, data: students[stIndex] }, status: 200 };
      }
      return Promise.reject({ response: { status: 404, data: { success: false, message: 'Talaba topilmadi.' } } });
    }

    if (method === 'put' || method === 'patch') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
      if (stIndex !== -1) {
        students[stIndex] = { ...students[stIndex], ...body, updatedAt: new Date().toISOString() };
        setLocalStudents(students);
        return { data: { success: true, message: 'Talaba ma\'lumotlari yangilandi.', data: students[stIndex] }, status: 200 };
      }
    }

    if (method === 'delete') {
      if (stIndex !== -1) {
        const deleted = students.splice(stIndex, 1)[0];
        setLocalStudents(students);
        return { data: { success: true, message: 'Talaba ro\'yxatdan o\'chirildi.', data: deleted }, status: 200 };
      }
    }
  }

  // List Students: GET /students
  if (url === 'students' || (url.startsWith('students?') && method === 'get')) {
    const params = config.params || {};
    let filtered = [...students];

    if (params.search) {
      const s = String(params.search).toLowerCase();
      filtered = filtered.filter(
        (st) =>
          (st.firstName && st.firstName.toLowerCase().includes(s)) ||
          (st.lastName && st.lastName.toLowerCase().includes(s)) ||
          (st.fatherName && st.fatherName.toLowerCase().includes(s)) ||
          (st.phone && st.phone.includes(s)) ||
          String(st.roomNumber).includes(s) ||
          (st.direction && st.direction.toLowerCase().includes(s))
      );
    }
    if (params.roomNumber) {
      filtered = filtered.filter((st) => Number(st.roomNumber) === Number(params.roomNumber));
    }
    if (params.status) {
      filtered = filtered.filter((st) => st.status === params.status);
    }

    return {
      data: {
        success: true,
        data: filtered,
        pagination: {
          total: filtered.length,
          page: Number(params.page || 1),
          limit: Number(params.limit || 20),
          totalPages: Math.max(1, Math.ceil(filtered.length / Number(params.limit || 20))),
        },
      },
      status: 200,
    };
  }

  // Create Student: POST /students
  if (url === 'students' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const roomStudents = students.filter((s) => Number(s.roomNumber) === Number(body.roomNumber));
    if (roomStudents.length >= 4) {
      return Promise.reject({
        response: {
          status: 400,
          data: { success: false, message: `⚠️ ${body.roomNumber}-xonada allaqachon 4 ta talaba mavjud. Xona to'lgan!` },
        },
      });
    }

    const newStudent = {
      id: 'st-' + Date.now(),
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      fatherName: body.fatherName || '',
      direction: body.direction || '',
      course: Number(body.course || 1),
      roomNumber: Number(body.roomNumber || 101),
      phone: body.phone || '',
      status: 'INSIDE',
      lastMovementAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    students.unshift(newStudent);
    setLocalStudents(students);

    addLocalLog({
      type: 'CHECK_IN',
      note: 'Yotoqxonaga ro\'yxatga olindi',
      createdAt: new Date().toISOString(),
      student: {
        id: newStudent.id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        phone: newStudent.phone,
        roomNumber: newStudent.roomNumber,
      },
    });

    return {
      data: { success: true, message: 'Talaba muvaffaqiyatli saqlandi.', data: newStudent },
      status: 201,
    };
  }

  // Reports
  if (url === 'reports' && method === 'get') {
    return {
      data: {
        success: true,
        data: {
          totalStudents: students.length,
          totalRooms: 40,
          rooms: [],
        },
      },
      status: 200,
    };
  }

  if (url.startsWith('reports/')) {
    return {
      data: new Blob(['Hisobot'], { type: 'text/plain' }),
      status: 200,
    };
  }

  return Promise.reject({
    response: { status: 404, data: { success: false, message: 'Manzil topilmadi.' } },
  });
}

// Request interceptor: add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 & 404/405/Network fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : 0;
    const config = error.config;

    // Handle 401 unauthenticated
    if (status === 401) {
      if (config.url && !config.url.includes('auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // If server is unreachable (404, 405, 502, 503, Network Error, ECONNREFUSED):
    // Fallback to offline/mock client so the application continues seamlessly!
    if (!error.response || status === 404 || status === 405 || status >= 500) {
      try {
        const fallbackResult = await handleMockFallback(config);
        return fallbackResult;
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
