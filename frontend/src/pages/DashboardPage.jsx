import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  PlusCircle,
  ArrowRight,
  DoorOpen,
  DoorClosed,
  History,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    insideStudents: 0,
    outsideStudents: 0,
    totalRooms: 0,
    freeSlots: 0,
    occupancyRate: 0,
    floorStats: [],
    directionStats: [],
    movementStats: [],
    roomStats: [],
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        api.get('/students/stats'),
        api.get('/students/logs', { params: { limit: 5 } }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (logsRes.data.success) {
        setRecentLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error('Dashboard ma\'lumotlarini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl shadow-blue-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/20">
              JONLI STATISTIKA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            🏠 YOTOQXONA BOSHQARUV TIZIMI
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
            Grafik tahlil, xonalar (patoklar) va harakat monitoringi
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/30"
          >
            <Building2 className="w-4 h-4" />
            Xonalar (Patoklar)
          </Link>
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors backdrop-blur-sm border border-white/10"
          >
            <PlusCircle className="w-4 h-4" />
            Talabalar
          </Link>
        </div>
      </div>

      {/* 4 Main Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
              Jami talabalar
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {loading ? '...' : stats.totalStudents}
            </span>
            <span className="text-xs text-gray-500 font-medium">nafar</span>
          </div>
        </div>

        {/* Inside Students */}
        <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">
              🟢 Yotoqxonada
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {loading ? '...' : stats.insideStudents || 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">nafar</span>
          </div>
        </div>

        {/* Outside Students */}
        <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-600">
              🔴 Tashqarida
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <DoorClosed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {loading ? '...' : stats.outsideStudents || 0}
            </span>
            <span className="text-xs text-rose-600 font-medium">nafar</span>
          </div>
        </div>

        {/* Rooms & Occupancy */}
        <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600">
              Band xonalar
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight">
              {loading ? '...' : stats.totalRooms}
            </span>
            <span className="text-xs text-indigo-600 font-medium">ta xona</span>
          </div>
        </div>
      </div>

      {/* 📊 Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Qavatlar bo'yicha talabalar soni (Bar Chart) */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Qavatlar Bo'yicha Taqsimot
                </h2>
                <p className="text-[11px] text-gray-500">
                  Har bir qavatdagi talabalar va xonada bo'lganlar
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {stats.floorStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Grafik uchun ma'lumot mavjud emas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.floorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="floor" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="students" name="Jami talabalar" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inside" name="Xonadagilar" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Yotoqxona Harakati & Nisbati (Donut Chart) */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Harakat va Davomat Nisbati
                </h2>
                <p className="text-[11px] text-gray-500">
                  Hozir yotoqxonada bo'lganlar va chiqib ketganlar ulushi
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {stats.totalStudents === 0 ? (
              <div className="text-xs text-gray-400">Harakat ma'lumotlari mavjud emas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.movementStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {stats.movementStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Rooms & Yo'nalishlar & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Yo'nalishlar taqsimoti */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Yo'nalishlar Bo'yicha
              </h2>
            </div>
          </div>

          {stats.directionStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Yo'nalish ma'lumotlari mavjud emas.
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.directionStats.map((dir, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span className="truncate pr-2">{dir.name}</span>
                    <span className="text-blue-600">{dir.count} ta</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (dir.count / (stats.totalStudents || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Xonalar (Patoklar) Quick Grid */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Xonalar Holati
              </h2>
            </div>
            <Link
              to="/rooms"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Barchasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.roomStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Xonalar mavjud emas.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {stats.roomStats.slice(0, 4).map((room) => (
                <Link
                  key={room.roomNumber}
                  to="/rooms"
                  className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-center hover:border-blue-400 transition-all block group"
                >
                  <p className="text-[10px] font-semibold text-slate-500">{room.floor}-qavat</p>
                  <p className="text-base font-black text-slate-900 group-hover:text-blue-600">
                    🏠 {room.roomNumber}
                  </p>
                  <p className="text-[11px] text-blue-600 font-bold mt-0.5">
                    {room.count}/4 talaba
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movement Logs Widget */}
        <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <History className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                So'nggi Harakatlar
              </h2>
            </div>
            <Link
              to="/logs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Tarix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Hozircha harakatlar tarixi yo'q.
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const isCheckIn = log.type === 'CHECK_IN';
                const st = log.student;

                return (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isCheckIn ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-semibold text-gray-800 truncate">
                        {st ? `${st.lastName} ${st.firstName}` : 'Talaba'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                          isCheckIn
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isCheckIn ? 'Kirdi' : 'Chiqdi'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
