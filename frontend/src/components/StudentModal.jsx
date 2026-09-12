import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSave, student = null, loading = false }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    direction: '',
    phone: '+998',
    roomNumber: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        fatherName: student.fatherName || '',
        direction: student.direction || '',
        phone: student.phone || '+998',
        roomNumber: student.roomNumber || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        fatherName: '',
        direction: '',
        phone: '+998',
        roomNumber: '',
      });
    }
    setError('');
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.firstName.trim()) {
      return setError('Talabaning ismini kiriting.');
    }
    if (!formData.lastName.trim()) {
      return setError('Talabaning familiyasini kiriting.');
    }
    if (!formData.fatherName.trim()) {
      return setError('Talabaning otasining ismini kiriting.');
    }
    if (!formData.direction.trim()) {
      return setError('Talabaning yo\'nalishini kiriting.');
    }
    if (!formData.phone.trim() || formData.phone.length < 9) {
      return setError('Telefon raqamini to\'liq kiriting (+998901234567).');
    }
    if (!formData.roomNumber || isNaN(parseInt(formData.roomNumber, 10))) {
      return setError('Xona raqamini butun son sifatida kiriting (masalan: 101, 205).');
    }

    onSave({
      ...formData,
      roomNumber: parseInt(formData.roomNumber, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
          <h2 className="text-lg font-bold text-gray-900">
            {student ? '✏️ Talaba ma\'lumotlarini tahrirlash' : '➕ Yangi talaba qo\'shish'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Ismi *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Azizbek"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Familiyasi *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Aliyev"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Otasining ismi *
            </label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="Anvar o‘g‘li"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Yo‘nalishi *
            </label>
            <input
              type="text"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              placeholder="Dasturiy injiniring"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Telefon raqami *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+998901234567"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Xona raqami *
              </label>
              <input
                type="number"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="205"
                required
                min="1"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : student ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
