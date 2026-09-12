const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 300, // 15 minutda 300 ta so'rov
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Juda ko\'p so\'rov yuborildi. Iltimos, birozdan so\'ng qayta urinib ko\'ring.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 20, // 15 minutda 20 ta login urinishi
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Login uchun juda ko\'p urinish bo\'ldi. Iltimos, 15 minutdan so\'ng qayta urinib ko\'ring.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
