import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, student, loading = false }) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">O'chirishni tasdiqlash</h3>
            <p className="text-sm text-gray-500">
              ⚠️ Ushbu talabani o‘chirishni tasdiqlaysizmi?
            </p>
          </div>
        </div>

        <div className="p-3.5 mb-6 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
          <p className="font-semibold text-gray-900">{student.lastName} {student.firstName} {student.fatherName}</p>
          <p className="text-xs text-gray-500 mt-1">Xona: {student.roomNumber} | Yo'nalish: {student.direction}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'O\'chirilmoqda...' : 'Ha, o‘chirish'}
          </button>
        </div>
      </div>
    </div>
  );
}
