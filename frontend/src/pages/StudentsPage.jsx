import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Users, RefreshCw, Filter, DoorOpen, DoorClosed, Phone, GraduationCap } from 'lucide-react';
import api from '../services/api';
import StudentModal from '../components/StudentModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  const { showToast } = useToast();

  const fetchStudents = useCallback(async (page = 1, searchQuery = search, room = roomFilter, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          page,
          limit: 20,
          search: searchQuery || undefined,
          roomNumber: room || undefined,
          status: status || undefined,
        },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Talabalarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roomFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1, search, roomFilter, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roomFilter, statusFilter]);

  const handlePageChange = (newPage) => {
    fetchStudents(newPage, search, roomFilter, statusFilter);
  };

  const handleToggleMovement = async (student) => {
    try {
      setToggleLoadingId(student.id);
      const res = await api.post(`/students/${student.id}/movement`, {});
      if (res.data.success) {
        showToast(
          `${student.firstName} ${student.lastName}: ${res.data.student.status === 'INSIDE' ? '🟢 Xonaga kirdi' : '🔴 Xonadan chiqdi'}`,
          'success'
        );
        fetchStudents(pagination.page, search, roomFilter, statusFilter);
      }
    } catch (err) {
      showToast('Holatni o\'zgartirishda xatolik yuz berdi.', 'error');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleSaveStudent = async (formData) => {
    try {
      setActionLoading(true);
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, formData);
        showToast('Talaba ma\'lumotlari muvaffaqiyatli yangilandi!', 'success');
      } else {
        await api.post('/students', formData);
        showToast('Yangi talaba muvaffaqiyatli saqlandi!', 'success');
      }
      setIsAddModalOpen(false);
      setEditingStudent(null);
      fetchStudents(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      setActionLoading(true);
      await api.delete(`/students/${deletingStudent.id}`);
      showToast('Talaba tizimdan o\'chirildi.', 'success');
      setDeletingStudent(null);
      fetchStudents(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'O\'chirishda xatolik yuz berdi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            👨🎓 Talabalar Boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ro'yxatdagi barcha talabalar, xonalari va kirish-chiqish holati
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yangi talaba qo'shish
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, familiya, ota ismi, yo'nalish, telefon yoki xona..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Room Filter */}
        <div className="relative w-full sm:w-36">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <input
            type="number"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            placeholder="Xona filtri"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Barcha holatlar</option>
            <option value="INSIDE">🟢 Yotoqxonada</option>
            <option value="OUTSIDE">🔴 Tashqarida</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchStudents(pagination.page)}
          title="Yangilash"
          className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors hidden sm:block"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Mobile Cards View (< lg screens) */}
      <div className="block lg:hidden space-y-3">
        {loading && students.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl">
            Yuklanmoqda...
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
            <div className="inline-flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-gray-100 text-gray-400">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Hozircha talabalar mavjud emas.</p>
          </div>
        ) : (
          students.map((st, idx) => {
            const globalIdx = (pagination.page - 1) * pagination.limit + idx + 1;
            const isInside = st.status === 'INSIDE';
            const isToggling = toggleLoadingId === st.id;

            return (
              <div
                key={st.id}
                className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {globalIdx}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {st.lastName} {st.firstName}
                      </h3>
                      <p className="text-xs text-gray-500">{st.fatherName}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100 text-blue-800">
                    🏠 {st.roomNumber}
                  </span>
                </div>

                {/* Direction and Phone */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-gray-50">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    🎓 {st.direction}
                  </span>

                  <a
                    href={`tel:${st.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold font-mono hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" /> {st.phone}
                  </a>
                </div>

                {/* Status Toggle & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleMovement(st)}
                    disabled={isToggling}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isInside
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {isInside ? (
                      <>
                        <DoorOpen className="w-3.5 h-3.5" /> 🟢 Yotoqxonada
                      </>
                    ) : (
                      <>
                        <DoorClosed className="w-3.5 h-3.5" /> 🔴 Tashqarida
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingStudent(st)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingStudent(st)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table View (>= lg screens) */}
      <div className="hidden lg:block bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th className="py-3.5 px-4 text-center w-12">№</th>
                <th className="py-3.5 px-4">Ismi</th>
                <th className="py-3.5 px-4">Familiyasi</th>
                <th className="py-3.5 px-4">Otasining ismi</th>
                <th className="py-3.5 px-4">Yo‘nalishi</th>
                <th className="py-3.5 px-4 text-center">Telefon</th>
                <th className="py-3.5 px-4 text-center">Xona</th>
                <th className="py-3.5 px-4 text-center">Holati</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center justify-center w-10 h-10 mb-2 rounded-full bg-gray-100 text-gray-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium">Hozircha talabalar mavjud emas.</p>
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => {
                  const globalIdx = (pagination.page - 1) * pagination.limit + idx + 1;
                  const isInside = st.status === 'INSIDE';
                  const isToggling = toggleLoadingId === st.id;

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-gray-500">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {st.firstName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {st.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {st.fatherName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {st.direction}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-600 font-mono text-xs">
                        <a href={`tel:${st.phone}`} className="hover:underline text-blue-600">
                          {st.phone}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                          🏠 {st.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleMovement(st)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 ${
                            isInside
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {isInside ? (
                            <>
                              <DoorOpen className="w-3 h-3" /> Yotoqxonada
                            </>
                          ) : (
                            <>
                              <DoorClosed className="w-3 h-3" /> Tashqarida
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingStudent(st)}
                            title="Tahrirlash"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(st)}
                            title="O'chirish"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination pagination={pagination} onPageChange={handlePageChange} />

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isAddModalOpen || editingStudent !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        student={editingStudent}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletingStudent !== null}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteStudent}
        student={deletingStudent}
        loading={actionLoading}
      />
    </div>
  );
}
