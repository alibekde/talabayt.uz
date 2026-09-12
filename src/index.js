const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { initBot } = require('./bot');

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// Security & Parsing
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible CDN & frontend assets
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram Bot Initialization
const bot = initBot();

if (bot) {
  if (config.nodeEnv === 'production' && config.webhookUrl) {
    // Webhook mode in production
    const webhookPath = `/api/telegram/webhook`;
    app.use(bot.webhookCallback(webhookPath));
    bot.telegram.setWebhook(`${config.webhookUrl}${webhookPath}`).then(() => {
      logger.info(`Telegram Bot Webhook sozlandi: ${config.webhookUrl}${webhookPath}`);
    });
  } else {
    // Polling mode in development
    bot.launch().then(() => {
      logger.info('Telegram Bot polling rejimida muvaffaqiyatli ishga tushdi.');
    }).catch((err) => {
      logger.warn('Telegram Bot launch ogohlantirish:', err.message);
    });
  }
}

// Serve Frontend Static Assets if built
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA Fallback for React Router
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Yotoqxona Boshqaruv Tizimi</title></head>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6;">
          <h2 style="color: #1e3a8a;">🏠 Yotoqxona Talabalari Boshqaruv Tizimi</h2>
          <p>Backend API muvaffaqiyatli ishlamoqda. Frontendni ishga tushirish uchun <code>npm run build:frontend</code> yoki <code>cd frontend && npm run dev</code> buyrug'ini bering.</p>
        </body>
        </html>
      `);
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server (only when not running inside Vercel serverless)
let server = null;
if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    logger.info(`Server ishga tushdi: http://localhost:${config.port} [${config.nodeEnv}]`);
  });
}

// Graceful Shutdown
const handleGracefulShutdown = (signal) => {
  logger.info(`${signal} signali qabul qilindi. Server to'xtatilmoqda...`);
  if (bot && !process.env.VERCEL) {
    bot.stop(signal);
  }
  if (server) {
    server.close(() => {
      logger.info('Server to\'liq to\'xtatildi.');
      process.exit(0);
    });
  }
};

process.once('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.once('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = app;
