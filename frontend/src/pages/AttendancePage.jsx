import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  Play,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  History,
  Copy,
  Check,
  RefreshCw,
  Search,
  Phone,
  DoorOpen,
  GraduationCap,
  Calendar,
  Eye,
  X,
  AlertCircle,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function AttendancePage() {
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('absent'); // 'absent' | 'attended' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // History detail modal state
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [historyDetailTab, setHistoryDetailTab] = useState('absent'); // 'absent' | 'attended'

  const { showToast } = useToast();
  const timerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch initial active state and history
  useEffect(() => {
    fetchActiveAttendance();
    fetchHistory();
    setupSseConnection();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (activeAttendance && activeAttendance.status === 'ACTIVE' && remainingSeconds > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            fetchActiveAttendance();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeAttendance?.id, activeAttendance?.status]);

  // Setup Server-Sent Events (SSE) for instant real-time live sync
  const setupSseConnection = () => {
    try {
      const sse = new EventSource('/api/attendance/live-stream');
      eventSourceRef.current = sse;

      sse.addEventListener('attendance_started', (e) => {
        const data = JSON.parse(e.data);
        setActiveAttendance(data);
        setRemainingSeconds(data.remainingSeconds || 30);
        showToast(`🔐 Yangi davomat ochildi! Kod: ${data.code}`, 'success');
        fetchHistory();
      });

      sse.addEventListener('attendance_updated', (e) => {
        const data = JSON.parse(e.data);
        setActiveAttendance(data);
        if (data.newRecord) {
          showToast(`✅ ${data.newRecord.firstName} ${data.newRecord.lastName} davomatdan o'tdi!`, 'success');
        }
      });

      sse.addEventListener('attendance_expired', (e) => {
        const data = JSON.parse(e.data);
        setActiveAttendance(data);
        setRemainingSeconds(0);
        showToast('⏰ Davomat vaqti yakunlandi (30 soniya tugadi).', 'info');
        fetchHistory();
      });

      sse.onerror = () => {
        // Fallback or reconnect handled automatically by browser EventSource
      };
    } catch (err) {
      console.error('SSE connection init error:', err);
    }
  };

  const fetchActiveAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/active');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setActiveAttendance(data);
        if (data.status === 'ACTIVE' && data.remainingSeconds > 0) {
          setRemainingSeconds(data.remainingSeconds);
        } else {
          setRemainingSeconds(0);
        }
      }
    } catch (err) {
      console.error('Faol davomatni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/attendance/history', { params: { limit: 30 } });
      if (res.data.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.error('Davomat tarixini yuklash xatosi:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartAttendance = async () => {
    try {
      setStartLoading(true);
      const res = await api.post('/attendance/start');
      if (res.data.success) {
        const newAtt = res.data.data;
        setActiveAttendance(newAtt);
        setRemainingSeconds(30);
        showToast(`✅ Yangi davomat ochildi! Kod: ${newAtt.code}`, 'success');
        fetchHistory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Davomatni boshlashda xatolik yuz berdi.', 'error');
    } finally {
      setStartLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Davomat kodi nusxalandi!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openHistoryDetails = async (id) => {
    try {
      setHistoryDetailLoading(true);
      const res = await api.get(`/attendance/${id}`);
      if (res.data.success) {
        setSelectedHistoryItem(res.data.data);
      }
    } catch (err) {
      showToast('Tafsilotlarni yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  // Filtered lists based on search term
  const filteredAbsentStudents = (activeAttendance?.absentStudents || []).filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.fatherName?.toLowerCase().includes(q) ||
      s.direction?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      String(s.roomNumber).includes(q)
    );
  });

  const filteredAttendedStudents = (activeAttendance?.attendedStudents || []).filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.fatherName?.toLowerCase().includes(q) ||
      s.direction?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      String(s.roomNumber).includes(q)
    );
  });

  const isActive = activeAttendance?.status === 'ACTIVE' && remainingSeconds > 0;
  const total = activeAttendance?.totalStudents || 0;
  const attended = activeAttendance?.attendedCount || 0;
  const absent = activeAttendance?.absentCount || Math.max(0, total - attended);
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Davomat Boshqaruvi
            </h1>
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                JONLI DAVOMAT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Admin bir martalik 30 soniyalik kod yaratadi, talabalar Telegram botda kiritadi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchActiveAttendance();
              fetchHistory();
            }}
            title="Yangilash"
            className="p-2.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleStartAttendance}
            disabled={startLoading || isActive}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
              isActive
                ? 'bg-gray-400 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 active:scale-95'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            {startLoading ? 'Ochilmoqda...' : isActive ? '⏳ Davomat ketmoqda' : '➕ Yangi davomat ochish'}
          </button>
        </div>
      </div>

      {/* Main Active Attendance Hero Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
        {/* Decorative ambient background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Code & Countdown */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                <Zap className="w-4 h-4 text-amber-400" />
                {isActive ? 'Faol Davomat Seansi' : 'So‘nggi Davomat Holati'}
              </div>

              {activeAttendance?.code ? (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl sm:text-5xl font-black font-mono tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-white to-blue-200">
                    {activeAttendance.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeAttendance.code)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Kodni nusxalash"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-slate-300 mt-2">
                  Davomat ochilmagan
                </p>
              )}
            </div>

            {/* Timer & Status Box */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3 min-w-[170px]">
                <div className={`p-2.5 rounded-xl ${isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'}`}>
                  <Clock className={`w-6 h-6 ${isActive ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-300 uppercase">Qolgan vaqt</p>
                  <p className="text-xl font-black">
                    {isActive ? `${remainingSeconds} soniya` : 'Tugagan'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3 min-w-[170px]">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-300 uppercase">Davomat ko'rsatkichi</p>
                  <p className="text-xl font-black">{attendanceRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 30s Countdown Visual Progress Bar */}
          {isActive && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span>⏱ 30 soniyalik vaqt sanog'i</span>
                <span className="font-mono font-bold">{remainingSeconds}s / 30s</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(remainingSeconds / 30) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 3 Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">👥 Jami talabalar</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{total}</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 uppercase">✅ Kelganlar</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{attended}</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-300 uppercase">❌ Kelmaganlar</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-300 mt-1">{absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('absent')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'absent'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Kelmaganlar ({absent})
            </button>

            <button
              onClick={() => setActiveTab('attended')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'attended'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Kelganlar ({attended})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Davomat Tarixi ({historyList.length})
            </button>
          </div>

          {/* Search Box (For lists) */}
          {activeTab !== 'history' && (
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ism, xona, yo'nalish..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Kelmaganlar Ro'yxati */}
        {activeTab === 'absent' && (
          <div className="p-4 sm:p-6">
            {filteredAbsentStudents.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Kelmagan talabalar mavjud emas
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Barcha talabalar davomatdan o'tgan yoki talabalar ro'yxati bo'sh.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">№</th>
                      <th className="pb-3 px-3">Talaba F.I.Sh.</th>
                      <th className="pb-3 px-3">Yo‘nalishi</th>
                      <th className="pb-3 px-3">Xona</th>
                      <th className="pb-3 px-3">Telefon</th>
                      <th className="pb-3 px-3">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredAbsentStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-gray-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                          {st.lastName} {st.firstName} {st.fatherName}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                            {st.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            <DoorOpen className="w-3.5 h-3.5" /> {st.roomNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <a href={`tel:${st.phone}`} className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                            <Phone className="w-3.5 h-3.5" /> {st.phone}
                          </a>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                            <XCircle className="w-3 h-3" /> Kelmadi
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Kelganlar Ro'yxati */}
        {activeTab === 'attended' && (
          <div className="p-4 sm:p-6">
            {filteredAttendedStudents.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-slate-400 space-y-2">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Hozircha hech kim davomatdan o'tmagan
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Talabalar Telegram bot orqali kod kiritishi bilan bu yerda real vaqtda paydo bo'ladi.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">№</th>
                      <th className="pb-3 px-3">Talaba F.I.Sh.</th>
                      <th className="pb-3 px-3">Yo‘nalishi</th>
                      <th className="pb-3 px-3">Xona</th>
                      <th className="pb-3 px-3">Telefon</th>
                      <th className="pb-3 px-3">Qayd etilgan vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredAttendedStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-gray-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                          {st.lastName} {st.firstName} {st.fatherName}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                            {st.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            <DoorOpen className="w-3.5 h-3.5" /> {st.roomNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <a href={`tel:${st.phone}`} className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                            <Phone className="w-3.5 h-3.5" /> {st.phone}
                          </a>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                          {st.markedAt ? new Date(st.markedAt).toLocaleTimeString('uz-UZ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Davomat Tarixi */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6">
            {historyLoading ? (
              <div className="py-16 text-center text-gray-400">Yuklanmoqda...</div>
            ) : historyList.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-slate-400 space-y-2">
                <History className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  Davomatlar tarixi mavjud emas
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Birinchi davomatni ochish uchun yuqoridagi tugmani bosing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-3">Sana va Vaqt</th>
                      <th className="pb-3 px-3">Davomat Kodi</th>
                      <th className="pb-3 px-3">Jami</th>
                      <th className="pb-3 px-3">Kelgan</th>
                      <th className="pb-3 px-3">Kelmagan</th>
                      <th className="pb-3 px-3">Ko'rsatkich</th>
                      <th className="pb-3 px-3">Holat</th>
                      <th className="pb-3 px-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {historyList.map((item) => {
                      const hRate = item.totalStudents > 0 ? Math.round((item.attendedCount / item.totalStudents) * 100) : 0;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(item.createdAt).toLocaleString('uz-UZ')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.code}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-700 dark:text-slate-300">
                            {item.totalStudents}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {item.attendedCount}
                          </td>
                          <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                            {item.absentCount}
                          </td>
                          <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                            {hRate}%
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                item.status === 'ACTIVE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {item.status === 'ACTIVE' ? 'Faol' : 'Tugagan'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => openHistoryDetails(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ko'rish
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Attendance Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto border border-gray-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div>
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-400" />
                  Davomat Tafsilotlari (Kod: {selectedHistoryItem.code})
                </h2>
                <p className="text-xs text-slate-300">
                  Sana: {new Date(selectedHistoryItem.createdAt || selectedHistoryItem.startedAt).toLocaleString('uz-UZ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Jami</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedHistoryItem.totalStudents}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Kelganlar</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedHistoryItem.attendedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-600 dark:text-rose-400">Kelmaganlar</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{selectedHistoryItem.absentCount}</p>
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setHistoryDetailTab('absent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    historyDetailTab === 'absent'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  ❌ Kelmaganlar ({selectedHistoryItem.absentStudents?.length || 0})
                </button>
                <button
                  onClick={() => setHistoryDetailTab('attended')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    historyDetailTab === 'attended'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  ✅ Kelganlar ({selectedHistoryItem.attendedStudents?.length || 0})
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 uppercase font-semibold">
                      <th className="pb-2 px-2">№</th>
                      <th className="pb-2 px-2">Ism Familiya</th>
                      <th className="pb-2 px-2">Yo‘nalish</th>
                      <th className="pb-2 px-2">Xona</th>
                      <th className="pb-2 px-2">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {(historyDetailTab === 'absent'
                      ? selectedHistoryItem.absentStudents || []
                      : selectedHistoryItem.attendedStudents || []
                    ).map((st, idx) => (
                      <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-2 text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 px-2 font-bold text-gray-900 dark:text-white">
                          {st.lastName} {st.firstName}
                        </td>
                        <td className="py-2.5 px-2 text-gray-500 dark:text-slate-400">{st.direction}</td>
                        <td className="py-2.5 px-2 font-semibold text-blue-600 dark:text-blue-400">🏠 {st.roomNumber}</td>
                        <td className="py-2.5 px-2 font-mono text-emerald-600 dark:text-emerald-400">{st.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-200 dark:bg-slate-700 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
