import React, { useState, useEffect } from 'react';
import { Building2, Users, DoorOpen, DoorClosed, ArrowRight, X, Phone, GraduationCap, Plus, BedDouble, CheckCircle2 } from 'lucide-react';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        setRooms(res.data.data.rooms);
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

  const handleAddStudentToRoom = async (formData) => {
    try {
      const res = await api.post('/students', formData);
      if (res.data.success) {
        showToast('Talaba ushbu xonaga muvaffaqiyatli biriktirildi!', 'success');
        setIsAddModalOpen(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            🏢 Xonalar (Patoklar) Boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xonalar sig'imi, bo'sh joylar va har bir xonadagi talabalar nazorati
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700">
            Jami: {rooms.length} ta xona
          </span>
        </div>
      </div>

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {floors.map((f) => (
          <button
            key={f.value}
            onClick={() => setFloorFilter(f.value)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              floorFilter === f.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          Xonalar yuklanmoqda...
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gray-100 text-gray-400">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            Hozircha xonalar mavjud emas.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Talabalar qo'shilgach, bu yerda avtomatik xona kartochkalari paydo bo'ladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const hasFree = room.freeSlots > 0;

            return (
              <div
                key={room.roomNumber}
                onClick={() => openRoomDetails(room.roomNumber)}
                className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg shadow-sm">
                      {room.roomNumber}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {room.floor}-qavat
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasFree
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {hasFree ? `🟢 ${room.freeSlots} ta bo'sh joy` : '🔴 To\'lgan (4/4)'}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Bandlik: {room.totalStudents}/4</span>
                      <span>{Math.round((room.totalStudents / 4) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          room.totalStudents >= 4 ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, (room.totalStudents / 4) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Presence summary */}
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5" /> Yotoqxonada:
                      </span>
                      <span className="font-bold text-emerald-700">{room.insideCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-rose-600 font-medium flex items-center gap-1">
                        <DoorClosed className="w-3.5 h-3.5" /> Tashqarida:
                      </span>
                      <span className="font-bold text-rose-700">{room.outsideCount}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Xonani ochish</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual Room Modal (e.g. 420-XONA) */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 text-white font-black text-xl backdrop-blur-sm border border-white/20">
                  {selectedRoom}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">🏠 {selectedRoom}-XONA TAFSILOTLARI</h2>
                  <p className="text-xs text-blue-200">
                    {roomDetails?.floor}-qavat patogi | {roomDetails?.totalStudents || 0}/4 kishi
                  </p>
                </div>
              </div>
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

            {/* Modal Body */}
            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {modalLoading ? (
                <div className="py-12 text-center text-gray-400">Yuklanmoqda...</div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500">Jami talabalar</p>
                      <p className="text-base sm:text-lg font-extrabold text-slate-900">
                        {roomDetails?.totalStudents || 0} / 4
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-emerald-600">🟢 Yotoqxonada</p>
                      <p className="text-base sm:text-lg font-extrabold text-emerald-700">
                        {roomDetails?.insideCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-rose-600">🔴 Tashqarida</p>
                      <p className="text-base sm:text-lg font-extrabold text-rose-700">
                        {roomDetails?.outsideCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Add Student Quick Trigger */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Yashayotgan talabalar
                    </h3>
                    {roomDetails && roomDetails.totalStudents < 4 && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Talaba biriktirish
                      </button>
                    )}
                  </div>

                  {/* Student Cards in Room */}
                  {!roomDetails || roomDetails.students.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                      Ushbu xonada hozircha talabalar mavjud emas.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roomDetails.students.map((st, idx) => {
                        const isInside = st.status === 'INSIDE';
                        const isUpdating = actionLoadingId === st.id;

                        return (
                          <div
                            key={st.id}
                            className="p-3.5 sm:p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                  {st.lastName} {st.firstName} {st.fatherName}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> {st.direction}
                                  </span>
                                  <a
                                    href={`tel:${st.phone}`}
                                    className="flex items-center gap-1 font-mono text-emerald-700 font-medium hover:underline"
                                  >
                                    <Phone className="w-3.5 h-3.5" /> {st.phone}
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Status and Action */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  isInside
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
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
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {isUpdating
                                  ? '...'
                                  : isInside
                                  ? '🚪 Chiqdi'
                                  : '🚪 Kirdi'}
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
            <div className="px-6 py-3.5 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomDetails(null);
                }}
                className="px-5 py-2 text-xs font-bold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add Student to Room Modal */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddStudentToRoom}
        student={selectedRoom ? { roomNumber: selectedRoom } : null}
      />
    </div>
  );
}
