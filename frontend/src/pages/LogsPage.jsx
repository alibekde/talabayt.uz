import React, { useState, useEffect } from 'react';
import { History, DoorOpen, DoorClosed, Clock, RefreshCw, User, Phone, Home } from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs(1, typeFilter);
  }, [typeFilter]);

  const fetchLogs = async (page = 1, type = typeFilter) => {
    try {
      setLoading(true);
      const res = await api.get('/students/logs', {
        params: {
          page,
          limit: 30,
          type: type || undefined,
        },
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Loglarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            📜 Kirish-Chiqish Tarixi
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Talabalarning yotoqxonaga kirishi va chiqib ketishi bo'yicha to'liq vaqt qaydnomasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
            Jami: {pagination.total} ta harakat
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              typeFilter === ''
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setTypeFilter('CHECK_IN')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
              typeFilter === 'CHECK_IN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" /> Faqat kirganlar
          </button>
          <button
            onClick={() => setTypeFilter('CHECK_OUT')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
              typeFilter === 'CHECK_OUT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" /> Faqat chiqqanlar
          </button>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page, typeFilter)}
          title="Yangilash"
          className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Logs List / Cards */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading && logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500">Tarix yuklanmoqda...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-400">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">Hozircha kirish-chiqish harakatlari mavjud emas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {logs.map((log) => {
              const isCheckIn = log.type === 'CHECK_IN';
              const st = log.student;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                        isCheckIn
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                      }`}
                    >
                      {isCheckIn ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {st ? `${st.lastName} ${st.firstName}` : 'Talaba'}
                        </h3>
                        {st && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                            🏠 {st.roomNumber}-xona
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {st?.direction && <span>🎓 {st.direction}</span>}
                        {st?.phone && (
                          <a
                            href={`tel:${st.phone}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                          >
                            📞 {st.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Movement badge & timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pl-12 sm:pl-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isCheckIn
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {isCheckIn ? '🟢 Xonaga kirdi' : '🔴 Xonadan chiqdi'}
                    </span>

                    <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchLogs(p, typeFilter)}
        />
      </div>
    </div>
  );
}
