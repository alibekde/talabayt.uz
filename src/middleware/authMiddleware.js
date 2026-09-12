const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Avtorizatsiyadan o\'tilmagan. Iltimos, tizimga kiring.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, createdAt: true },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin hisobi topilmadi.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Yaroqsiz yoki muddati o\'tgan token.',
    });
  }
}

module.exports = authMiddleware;
