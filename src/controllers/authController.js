const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const config = require('../config');
const { loginSchema } = require('../utils/validation');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Login yoki parol noto\'g\'ri.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Login yoki parol noto\'g\'ri.',
        });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(200).json({
        success: true,
        message: 'Tizimga muvaffaqiyatli kirildi.',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        admin: req.admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Tizimdan chiqildi.',
    });
  }
}

module.exports = new AuthController();
