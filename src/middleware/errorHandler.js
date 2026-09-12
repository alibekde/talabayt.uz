const { ZodError } = require('zod');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`[API Xatosi] ${req.method} ${req.originalUrl}:`, err);

  // Zod validation error
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages || 'Kiritilgan ma\'lumotlar yaroqsiz.',
      errors: err.errors,
    });
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Ushbu ma\'lumot tizimda allaqachon mavjud.',
    });
  }

  // Custom known application error
  if (err.isCustom) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }

  // Generic server error (do not expose stack trace)
  return res.status(500).json({
    success: false,
    message: 'Serverda kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
  });
}

module.exports = errorHandler;
