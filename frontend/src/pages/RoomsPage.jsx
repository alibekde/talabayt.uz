import React, { useState, useEffect } from 'react';
import { Building2, Users, DoorOpen, DoorClosed, ArrowRight, X, Phone, GraduationCap, Plus, Trash2, Bed, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import StudentModal from '../components/StudentModal';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modals state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchRooms(floorFilter);
  }, [floorFilter]);

  const fetchRooms = async (floor) => {
    try {
      setLoading(true);
      const res = await api.get('/students/rooms', {
        params: { floor: floor || undefined },
      });
      if (res.data.success) {
        setRooms(res.data.data.rooms || []);
      }
    } catch (err) {
      console.error('Xonalarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRoomDetails = async (roomNumber) => {
    try {
      setSelectedRoom(roomNumber);
      setModalLoading(true);
      const res = await api.get(`/students/rooms/${roomNumber}`);
      if (res.data.success) {
        setRoomDetails(res.data.data);
      }
    } catch (err) {
      showToast('Xona ma\'lumotlarini yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleMovement = async (studentId, studentName) => {
    try {
      setActionLoadingId(studentId);
      const res = await api.post(`/students/${studentId}/movement`, {});
      if (res.data.success) {
        showToast(
          `${studentName} holati: ${res.data.student.status === 'INSIDE' ? '🟢 Xonaga kirdi' : '🔴 Xonadan chiqdi'}`,
          'success'
        );
        if (selectedRoom) {
          const detailRes = await api.get(`/students/rooms/${selectedRoom}`);
          if (detailRes.data.success) {
            setRoomDetails(detailRes.data.data);
          }
        }
        fetchRooms(floorFilter);
      }
    } catch (err) {
      showToast('Holatni o\'zgartirishda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const rNum = parseInt(newRoomNumber, 10);
    if (!rNum || isNaN(rNum) || rNum < 1) {
      showToast('Iltimos, to\'g\'ri xona raqamini kiriting (masalan: 101, 204, 305).', 'error');
      return;
    }

    try {
      setCreateRoomLoading(true);
      const res = await api.post('/students/rooms', { roomNumber: rNum });
      if (res.data.success) {
        showToast(`🏠 ${rNum}-xona muvaffaqiyatli yaratildi!`, 'success');
        setIsCreateRoomModalOpen(false);
        setNewRoomNumber('');
        fetchRooms(floorFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Xona yaratishda xatolik yuz berdi.', 'error');
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const handleDeleteRoom = async (roomNumber) => {
    if (!window.confirm(`${roomNumber}-xonani o'chirishni tasdiqlaysizmi?`)) {
      return;
    }

    try {
      const res = await api.delete(`/students/rooms/${roomNumber}`);
      if (res.data.success) {
        showToast(`🗑️ ${roomNumber}-xona muvaffaqiyatli o'chirildi.`, 'success');
        setSelectedRoom(null);
        setRoomDetails(null);
        fetchRooms(floorFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Xonani o\'chirishda xatolik yuz berdi.', 'error');
    }
  };

  const handleAddStudentToRoom = async (formData) => {
    try {
      const res = await api.post('/students', formData);
      if (res.data.success) {
        showToast('Talaba ushbu xonaga muvaffaqiyatli biriktirildi!', 'success');
        setIsAddStudentModalOpen(false);
        if (selectedRoom) {
          const detailRes = await api.get(`/students/rooms/${selectedRoom}`);
          if (detailRes.data.success) {
            setRoomDetails(detailRes.data.data);
          }
        }
        fetchRooms(floorFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const floors = [
    { label: 'Barchasi', value: '' },
    { label: '1-qavat (100-lar)', value: '1' },
    { label: '2-qavat (200-lar)', value: '2' },
    { label: '3-qavat (300-lar)', value: '3' },
    { label: '4-qavat (400-lar)', value: '4' },
    { label: '5-qavat (500-lar)', value: '5' },
  ];

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            🏢 Xonalar (Patoklar) Boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Xonalar sig'imi, bo'sh joylar va har bir xonadagi talabalar nazorati
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
            Jami: {rooms.length} ta xona
          </span>
          <button
            onClick={() => setIsCreateRoomModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yangi xona ochish
          </button>
        </div>
      </div>

      {/* Floor Filter Tabs (Only shown if rooms exist) */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {floors.map((f) => (
            <button
              key={f.value}
              onClick={() => setFloorFilter(f.value)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                floorFilter === f.value
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Rooms Grid or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
          Xonalar yuklanmoqda...
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Hozircha xonalar mavjud emas
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Yangi talaba qo'shilganda xonalar avtomatik shakllanadi yoki quyidagi tugma orqali oldindan yangi xona ochishingiz mumkin.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yangi xona ochish
            </button>
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
            >
              <Users className="w-4 h-4" />
              Talaba qo'shish
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const hasFree = room.freeSlots > 0;

            return (
              <div
                key={room.roomNumber}
                onClick={() => openRoomDetails(room.roomNumber)}
                className="p-5 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg shadow-sm">
                      {room.roomNumber}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {room.floor}-qavat
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasFree
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                        }`}
                      >
                        {hasFree ? `🟢 ${room.freeSlots} ta bo'sh joy` : '🔴 To\'lgan (3/3)'}
                      </span>
                    </div>
                  </div>

                  {/* 3-Bed Visual Grid */}
                  <div className="grid grid-cols-3 gap-1.5 my-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    {[0, 1, 2].map((slotIdx) => {
                      const st = room.students && room.students[slotIdx];
                      const isOccupied = Boolean(st);

                      return (
                        <div
                          key={slotIdx}
                          title={isOccupied ? `${st.firstName} ${st.lastName}` : 'Bo\'sh o\'rin'}
                          className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-center transition-all ${
                            isOccupied
                              ? st.status === 'INSIDE'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-white dark:bg-slate-800/80 text-gray-300 dark:text-slate-600 border border-dashed border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <Bed className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold mt-0.5">
                            {isOccupied ? `#${slotIdx + 1}` : 'Bo\'sh'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                      <span>Bandlik: {room.totalStudents}/3</span>
                      <span>{Math.round((room.totalStudents / 3) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          room.totalStudents >= 3 ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, (room.totalStudents / 3) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Presence summary */}
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5" /> Yotoqxonada:
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{room.insideCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                        <DoorClosed className="w-3.5 h-3.5" /> Tashqarida:
                      </span>
                      <span className="font-bold text-rose-700 dark:text-rose-400">{room.outsideCount}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">
                  <span>Xonani ochish</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Room Modal */}
      {isCreateRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Yangi Xona Ochish
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Xona raqami va sig'imini belgilang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateRoomModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                  Xona raqami *
                </label>
                <input
                  type="number"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="Masalan: 101, 204, 312..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                {newRoomNumber && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                    📌 Joylashuvi: {Math.floor(Number(newRoomNumber) / 100) || 1}-qavat | Standart sig'im: 3 ta o'rin
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createRoomLoading || !newRoomNumber}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
                >
                  {createRoomLoading ? 'Yaratilmoqda...' : '✅ Xonani yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Room Modal (e.g. 420-XONA) */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto border border-gray-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 text-white font-black text-xl backdrop-blur-sm border border-white/20">
                  {selectedRoom}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">🏠 {selectedRoom}-XONA TAFSILOTLARI</h2>
                  <p className="text-xs text-blue-200">
                    {roomDetails?.floor}-qavat patogi | {roomDetails?.totalStudents || 0}/3 kishi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {roomDetails && roomDetails.totalStudents === 0 && (
                  <button
                    onClick={() => handleDeleteRoom(selectedRoom)}
                    title="Bo'sh xonani o'chirish"
                    className="p-1.5 text-rose-300 hover:text-rose-100 rounded-xl hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setRoomDetails(null);
                  }}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 transition-colors">
              {modalLoading ? (
                <div className="py-12 text-center text-gray-400 dark:text-slate-500">Yuklanmoqda...</div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Jami talabalar</p>
                      <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {roomDetails?.totalStudents || 0} / 3
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">🟢 Yotoqxonada</p>
                      <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                        {roomDetails?.insideCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400">🔴 Tashqarida</p>
                      <p className="text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-400">
                        {roomDetails?.outsideCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Add Student Quick Trigger */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Yashayotgan talabalar
                    </h3>
                    {roomDetails && roomDetails.totalStudents < 3 && (
                      <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Talaba biriktirish
                      </button>
                    )}
                  </div>

                  {/* Student Cards in Room */}
                  {!roomDetails || roomDetails.students.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
                      <p className="text-sm font-medium">Ushbu xonada hozircha talabalar mavjud emas.</p>
                      <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Birinchi talabani joylashtirish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roomDetails.students.map((st, idx) => {
                        const isInside = st.status === 'INSIDE';
                        const isUpdating = actionLoadingId === st.id;

                        return (
                          <div
                            key={st.id}
                            className="p-3.5 sm:p-4 bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm hover:border-gray-300 dark:hover:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                  {st.lastName} {st.firstName} {st.fatherName}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {st.direction}
                                  </span>
                                  <a
                                    href={`tel:${st.phone}`}
                                    className="flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                                  >
                                    <Phone className="w-3.5 h-3.5" /> {st.phone}
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Status and Action */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-700">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isInside
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                }`}
                              >
                                {isInside ? (
                                  <>
                                    <DoorOpen className="w-3 h-3" /> Yotoqxonada
                                  </>
                                ) : (
                                  <>
                                    <DoorClosed className="w-3 h-3" /> Chiqib ketgan
                                  </>
                                )}
                              </span>

                              <button
                                onClick={() => handleToggleMovement(st.id, `${st.firstName} ${st.lastName}`)}
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                                  isInside
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50'
                                }`}
                              >
                                {isUpdating ? '...' : isInside ? '🔴 Chiqarish' : '🟢 Kiritish'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              {roomDetails && roomDetails.totalStudents === 0 ? (
                <button
                  onClick={() => handleDeleteRoom(selectedRoom)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bo'sh xonani o'chirish
                </button>
              ) : (
                <span className="text-xs text-gray-400">Xona bandligi: {roomDetails?.totalStudents || 0}/3</span>
              )}
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomDetails(null);
                }}
                className="px-5 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 bg-gray-200 dark:bg-slate-700 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add Student to Room Modal */}
      <StudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onSave={handleAddStudentToRoom}
        student={selectedRoom ? { roomNumber: selectedRoom } : null}
      />
    </div>
  );
}
