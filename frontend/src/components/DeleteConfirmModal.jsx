import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, student, loading = false }) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">O'chirishni tasdiqlash</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              ⚠️ Ushbu talabani o‘chirishni tasdiqlaysizmi?
            </p>
          </div>
        </div>

        <div className="p-3.5 mb-6 text-sm bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-700 dark:text-slate-200">
          <p className="font-semibold text-gray-900 dark:text-white">{student.lastName} {student.firstName} {student.fatherName}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Xona: {student.roomNumber} | Yo'nalish: {student.direction}</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-md shadow-rose-600/20"
          >
            {loading ? 'O\'chirilmoqda...' : 'Ha, o‘chirish'}
          </button>
        </div>
      </div>
    </div>
  );
}
