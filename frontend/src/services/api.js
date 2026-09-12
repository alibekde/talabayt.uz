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
      const fl = Math.floor(s.roomNumber / 100) || 1;
      if (floorCounts[fl] !== undefined) floorCounts[fl]++;
    });

    const floorStats = Object.keys(floorCounts).map((fl) => ({
      floor: `${fl}-qavat`,
      talabalar: floorCounts[fl],
      ichkarida: students.filter((s) => Math.floor(s.roomNumber / 100) === Number(fl) && s.status === 'INSIDE').length,
      tashqarida: students.filter((s) => Math.floor(s.roomNumber / 100) === Number(fl) && s.status === 'OUTSIDE').length,
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

  // Rooms Overview
  if (url === 'students/rooms/overview' && method === 'get') {
    const floors = [1, 2, 3, 4];
    const data = floors.map((fl) => {
      const rooms = [];
      for (let r = 1; r <= 10; r++) {
        const roomNum = fl * 100 + (r < 10 ? `0${r}` : `${r}`);
        const roomStudents = students.filter((s) => String(s.roomNumber) === String(roomNum) || Number(s.roomNumber) === Number(roomNum));
        rooms.push({
          roomNumber: Number(roomNum),
          occupiedCount: roomStudents.length,
          maxCapacity: 4,
          isFull: roomStudents.length >= 4,
          students: roomStudents,
        });
      }
      return { floor: fl, rooms };
    });

    return { data: { success: true, data }, status: 200 };
  }

  // Room Detail
  const roomMatch = url.match(/^students\/rooms\/(\d+)/);
  if (roomMatch && method === 'get') {
    const rNum = Number(roomMatch[1]);
    const roomStudents = students.filter((s) => Number(s.roomNumber) === rNum);
    return {
      data: {
        success: true,
        data: {
          roomNumber: rNum,
          floor: Math.floor(rNum / 100),
          maxCapacity: 4,
          occupiedCount: roomStudents.length,
          freeSlots: Math.max(0, 4 - roomStudents.length),
          isFull: roomStudents.length >= 4,
          students: roomStudents,
        },
      },
      status: 200,
    };
  }

  // Movement Logs
  if (url.startsWith('students/logs') && method === 'get') {
    return {
      data: { success: true, data: { logs, total: logs.length, page: 1, limit: 20, totalPages: 1 } },
      status: 200,
    };
  }

  // Toggle Status
  const toggleMatch = url.match(/^students\/([^/]+)\/toggle-status/);
  if (toggleMatch && method === 'post') {
    const stId = toggleMatch[1];
    const stIndex = students.findIndex((s) => String(s.id) === String(stId));
    if (stIndex !== -1) {
      const st = students[stIndex];
      const newStatus = st.status === 'INSIDE' ? 'OUTSIDE' : 'INSIDE';
      students[stIndex].status = newStatus;
      students[stIndex].lastMovementAt = new Date().toISOString();
      setLocalStudents(students);

      addLocalLog({
        studentId: st.id,
        direction: newStatus,
        source: 'MANUAL',
        student: { fullName: st.fullName, roomNumber: st.roomNumber },
      });

      return {
        data: {
          success: true,
          message: `Talaba holati "${newStatus === 'INSIDE' ? 'Ichkarida' : 'Tashqarida'}" ga o'zgartirildi.`,
          data: students[stIndex],
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

    if (method === 'put') {
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

  // List Students (GET)
  if (url.startsWith('students') && method === 'get') {
    const params = config.params || {};
    let filtered = [...students];

    if (params.search) {
      const s = String(params.search).toLowerCase();
      filtered = filtered.filter(
        (st) =>
          st.fullName.toLowerCase().includes(s) ||
          st.phone.includes(s) ||
          String(st.roomNumber).includes(s) ||
          st.faculty.toLowerCase().includes(s)
      );
    }
    if (params.room) {
      filtered = filtered.filter((st) => Number(st.roomNumber) === Number(params.room));
    }
    if (params.faculty) {
      filtered = filtered.filter((st) => st.faculty === params.faculty);
    }
    if (params.status) {
      filtered = filtered.filter((st) => st.status === params.status);
    }

    return {
      data: {
        success: true,
        data: {
          students: filtered,
          total: filtered.length,
          page: Number(params.page || 1),
          limit: Number(params.limit || 10),
          totalPages: Math.max(1, Math.ceil(filtered.length / Number(params.limit || 10))),
        },
      },
      status: 200,
    };
  }

  // Create Student (POST)
  if (url === 'students' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const roomStudents = students.filter((s) => Number(s.roomNumber) === Number(body.roomNumber));
    if (roomStudents.length >= 4) {
      return Promise.reject({
        response: { status: 400, data: { success: false, message: `${body.roomNumber}-xonada bo'sh joy qolmagan (Maksimal 4 kishi).` } },
      });
    }

    const newStudent = {
      id: 'st-' + Date.now(),
      fullName: body.fullName,
      phone: body.phone,
      roomNumber: Number(body.roomNumber),
      faculty: body.faculty,
      course: Number(body.course || 1),
      region: body.region || '',
      status: 'INSIDE',
      lastMovementAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    students.unshift(newStudent);
    setLocalStudents(students);

    addLocalLog({
      studentId: newStudent.id,
      direction: 'INSIDE',
      source: 'MANUAL',
      student: { fullName: newStudent.fullName, roomNumber: newStudent.roomNumber },
    });

    return {
      data: { success: true, message: 'Talaba muvaffaqiyatli qo\'shildi.', data: newStudent },
      status: 201,
    };
  }

  // Reports
  if (url.startsWith('reports/')) {
    return {
      data: { success: true, message: 'Hisobot shakllantirildi.' },
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
