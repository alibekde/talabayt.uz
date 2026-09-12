import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Download, ExternalLink, RefreshCw, Home, Users, CheckCircle2, Sparkles, ArrowDownToLine } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function ReportsPage() {
  const [report, setReport] = useState({ totalStudents: 0, totalRooms: 0, rooms: [] });
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [sheetsResult, setSheetsResult] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      if (res.data.success) {
        setReport(res.data.data);
      }
    } catch (err) {
      console.error('Hisobot yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExportingPdf(true);
      const res = await api.get('/reports/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `yotoqxona_talabalari_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('📄 PDF hisobot muvaffaqiyatli yuklab olindi!', 'success');
    } catch (err) {
      showToast('PDF yuklab olishda xatolik yuz berdi.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setExportingExcel(true);
      const res = await api.get('/reports/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `yotoqxona_talabalari_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('📊 Excel jadval muvaffaqiyatli yuklab olindi!', 'success');
    } catch (err) {
      showToast('Excel yuklab olishda xatolik yuz berdi.', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportGoogleSheets = async () => {
    try {
      setExportingSheets(true);
      setSheetsResult(null);
      const res = await api.post('/reports/google-sheets');
      if (res.data.success) {
        setSheetsResult(res.data.data);
        showToast('📑 Google Sheets ga muvaffaqiyatli eksport qilindi!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Google Sheets eksportida xatolik yuz berdi.', 'error');
    } finally {
      setExportingSheets(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl shadow-blue-950/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/20">
                EKSPORT VA HISOBOTLAR MARKAZI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              📊 YOTOQXONA TALABALARI HISOBOTI
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
              Xona raqamlari bo'yicha o'sish tartibida saralangan rasmiy hisobotlar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/10">
              <Users className="w-3.5 h-3.5 text-blue-300" /> Jami: {report.totalStudents} ta
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/10">
              <Home className="w-3.5 h-3.5 text-emerald-300" /> Xonalar: {report.totalRooms} ta
            </span>
          </div>
        </div>
      </div>

      {/* 3 Modern Export Format Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PDF Export Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              A4 FORMAT
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">PDF Rasmiy Hisobot</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Unicode / UTF-8 qo'llab-quvvatlovchi, xonalar bo'yicha tartiblangan toza jadval
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf || report.totalStudents === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {exportingPdf ? 'Tayyorlanmoqda...' : '📄 PDF yuklab olish'}
          </button>
        </div>

        {/* Excel Export Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              .XLSX JADVAL
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Excel Elektron Jadvali</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Rangli sarlavhalar, muzlatilgan birinchi qator va avto-kenglik bilan
            </p>
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={exportingExcel || report.totalStudents === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {exportingExcel ? 'Tayyorlanmoqda...' : '📊 Excel yuklab olish'}
          </button>
        </div>

        {/* Google Sheets Export Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Download className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              CLOUD SYNC
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Google Spreadsheet</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Google Sheets API orqali to'g'ridan-to'g'ri bulutli jadvalga batch yuklash
            </p>
          </div>

          <button
            onClick={handleExportGoogleSheets}
            disabled={exportingSheets || report.totalStudents === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            {exportingSheets ? 'Yuklanmoqda...' : '📑 Google Sheets'}
          </button>
        </div>
      </div>

      {/* Google Sheets Live Link Box */}
      {sheetsResult && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 transition-colors">
          <div>
            <p className="font-bold text-sm">✅ Google Sheets jadvaliga muvaffaqiyatli eksport qilindi!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Jami {sheetsResult.totalStudents} ta talaba ma'lumotlari yangilandi.</p>
          </div>
          <a
            href={sheetsResult.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Jadvalni ochish <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Grouped Room Listings Preview */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800">
          Hisobot ma'lumotlari yuklanmoqda...
        </div>
      ) : report.totalStudents === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
            Hozircha hisobot yaratish uchun ma’lumot mavjud emas.
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Talabalar qo'shilgach, bu yerda xonalar bo'yicha tartiblangan hisobot paydo bo'ladi.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">
            Xonalar Bo'yicha Guruhlangan Ko'rinish ({report.rooms.length} ta xona)
          </h2>

          {report.rooms.map((room) => (
            <div
              key={room.roomNumber}
              className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors"
            >
              {/* Room Header Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-black">
                    {room.roomNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      🏠 {room.roomNumber}-XONA
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {Math.floor(room.roomNumber / 100) || 1}-qavat patogi | {room.studentsCount}/4 talaba
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-200/90 dark:bg-slate-800/80 text-xs font-black uppercase text-gray-900 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                      <th className="py-2.5 px-4 w-12 text-center text-gray-900 dark:text-slate-200">№</th>
                      <th className="py-2.5 px-4 text-gray-900 dark:text-slate-200">Familiyasi va Ismi</th>
                      <th className="py-2.5 px-4 text-gray-900 dark:text-slate-200">Otasining ismi</th>
                      <th className="py-2.5 px-4 text-gray-900 dark:text-slate-200">Yo‘nalishi</th>
                      <th className="py-2.5 px-4 text-center text-gray-900 dark:text-slate-200">Telefon raqami</th>
                      <th className="py-2.5 px-4 text-center text-gray-900 dark:text-slate-200">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {room.students.map((st, sIdx) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-center font-medium text-gray-400 dark:text-slate-500">
                          {sIdx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">
                          {st.lastName} {st.firstName}
                        </td>
                        <td className="py-2.5 px-4 text-gray-700 dark:text-slate-300">
                          {st.fatherName}
                        </td>
                        <td className="py-2.5 px-4 text-gray-600 dark:text-slate-400">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {st.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-xs text-gray-600 dark:text-slate-400">
                          {st.phone}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              st.status === 'INSIDE'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {st.status === 'INSIDE' ? '🟢 Xonada' : '🔴 Chiqqan'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
