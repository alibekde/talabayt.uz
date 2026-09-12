const { Telegraf, Scenes, session, Markup } = require('telegraf');
const config = require('../config');
const logger = require('../utils/logger');
const studentService = require('../services/studentService');
const reportService = require('../services/reportService');
const googleSheetsService = require('../services/googleSheetsService');
const notificationService = require('../services/notificationService');
const {
  addStudentWizard,
  searchWizard,
  roomDetailWizard,
  attendanceWizard,
  isAdmin,
  getUserKeyboard,
  getAdminKeyboard,
  getMainKeyboardForUser,
} = require('./scenes');

let bot = null;

function initBot() {
  if (!config.botToken) {
    logger.warn('BOT_TOKEN belgilanmagan. Telegram bot ishga tushirilmadi.');
    return null;
  }

  bot = new Telegraf(config.botToken);
  notificationService.setBotInstance(bot);

  // Session & Stage Setup
  const stage = new Scenes.Stage([addStudentWizard, searchWizard, roomDetailWizard, attendanceWizard]);
  bot.use(session());
  bot.use(stage.middleware());

  // /start komandasi
  bot.start(async (ctx) => {
    const userId = ctx.from?.id;
    const userIsAdmin = isAdmin(userId);

    if (userIsAdmin) {
      const adminText =
        `🏠 YOTOQXONA TALABALARI (ADMIN PANEL)\n\n` +
        `Assalomu alaykum, Hurmatli Admin!\n` +
        `Siz to'liq administratorlik huquqiga egasiz.\n\n` +
        `Quyidagi bo'limlardan birini tanlang yoki [🌐 Web Admin Panel] tugmasi orqali to'g'ridan-to'g'ri boshqaruv panelini oching:`;
      await ctx.reply(adminText, getAdminKeyboard());
    } else {
      // Check if student is already registered
      const prisma = require('../config/database');
      let existing = null;
      try {
        existing = await prisma.student.findUnique({
          where: { telegramUserId: String(userId) },
        });
      } catch (e) {}

      if (existing) {
        const userText =
          `🏠 YOTOQXONA TALABALARI\n\n` +
          `Assalomu alaykum, ${existing.firstName}!\n\n` +
          `Siz tizimda ro'yxatdan o'tgansiz.\n` +
          `Davomat vaqtida [📋 Davomat] tugmasini bosing yoki ma'lumotlaringizni ko'rish uchun [👤 Mening ma'lumotlarim] tugmasidan foydalaning.`;
        await ctx.reply(userText, getUserKeyboard());
      } else {
        const userText =
          `🏠 YOTOQXONA TALABALARI\n\n` +
          `Assalomu alaykum! Yotoqxona talabalarini ro‘yxatga olish tizimi.\n\n` +
          `Ro'yxatdan o'tish uchun quyidagi [➕ Ro'yxatdan o'tish] tugmasini bosing:`;
        await ctx.reply(userText, getUserKeyboard());
      }
    }
  });

  // /admin komandasi
  bot.command('admin', async (ctx) => {
    const userId = ctx.from?.id;
    const userIsAdmin = isAdmin(userId);

    if (userIsAdmin) {
      const adminText =
        `⚙️ ADMIN PANEL BOSHQARUVI\n\n` +
        `Barcha ma'lumotlar va bo'limlar siz uchun ochiq.\n` +
        `Kerakli bo'limni tanlang:`;
      await ctx.reply(adminText, getAdminKeyboard());
    } else {
      await ctx.reply(
        `⛔ Sizda administrator huquqi mavjud emas.\n\nSizning Telegram ID: <code>${userId}</code>`,
        { parse_mode: 'HTML', ...getUserKeyboard() }
      );
    }
  });

  // 🌐 Web Admin Panel buyrug'i va tugmasi
  bot.hears('🌐 Web Admin Panel', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.reply('⛔ Sizda administrator huquqi mavjud emas.', getUserKeyboard());
    }
    const webUrl = config.webAppUrl || 'https://talabayt-uz.vercel.app';
    await ctx.reply(
      `🌐 <b>YOTOQXONA WEB ADMIN PANELI</b>\n\n` +
      `Web panel orqali barcha talabalar, xonalar (patoklar), davomat, jonli statistika va hisobotlarni to'liq boshqarishingiz mumkin.\n\n` +
      `🔗 <b>Manzil:</b> ${webUrl}`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🌐 Web Panelni Telegram ichida ochish', webUrl)],
          [Markup.button.url('🔗 Brauzerda ochish', webUrl)],
        ]),
      }
    );
  });

  bot.command('webapp', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.reply('⛔ Sizda administrator huquqi mavjud emas.', getUserKeyboard());
    }
    const webUrl = config.webAppUrl || 'https://talabayt-uz.vercel.app';
    await ctx.reply(
      `🌐 Web Admin Panelni ochish:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🌐 Web Panelni ochish', webUrl)],
        [Markup.button.url('🔗 Brauzerda ochish', webUrl)],
      ])
    );
  });

  // 👤 Mening ma'lumotlarim
  bot.hears('👤 Mening ma\'lumotlarim', async (ctx) => {
    const userId = ctx.from?.id;
    const prisma = require('../config/database');
    try {
      const student = await prisma.student.findUnique({
        where: { telegramUserId: String(userId) },
      });

      if (!student) {
        return ctx.reply(
          `❌ Siz hali tizimda ro'yxatdan o'tmagansiz.\n\nRo'yxatdan o'tish uchun [➕ Ro'yxatdan o'tish] tugmasini bosing.`,
          getUserKeyboard()
        );
      }

      const infoText =
        `📋 TALABA MA'LUMOTLARI\n\n` +
        `👤 Ismi: ${student.firstName}\n` +
        `👤 Familiyasi: ${student.lastName}\n` +
        `👨 Otasining ismi: ${student.fatherName}\n` +
        `🎓 Yo‘nalishi: ${student.direction}\n` +
        `🏠 Xona: ${student.roomNumber}\n` +
        `📱 Telefon: ${student.phone}\n` +
        `🟢 Holati: ${student.status === 'INSIDE' ? 'Yotoqxonada' : 'Tashqarida'}`;

      await ctx.reply(infoText, getMainKeyboardForUser(userId));
    } catch (err) {
      logger.error('Mening ma\'lumotlarim xatosi:', err.message);
      await ctx.reply('❌ Ma\'lumotlarni olishda xatolik yuz berdi.', getMainKeyboardForUser(userId));
    }
  });

  // 📋 Davomat (Talaba va Admin uchun)
  bot.hears('📋 Davomat', (ctx) => {
    ctx.scene.enter('ATTENDANCE_WIZARD');
  });

  bot.command('davomat', (ctx) => {
    ctx.scene.enter('ATTENDANCE_WIZARD');
  });

  // ➕ Ro'yxatdan o'tish / Talaba qo'shish (Barchaga ochiq)
  bot.hears(['➕ Ro\'yxatdan o\'tish', '➕ Talaba qo‘shish'], (ctx) => {
    ctx.scene.enter('ADD_STUDENT_WIZARD');
  });

  // Admin Guard Middleware helper
  const requireAdmin = (handler) => {
    return async (ctx) => {
      const userId = ctx.from?.id;
      if (!isAdmin(userId)) {
        return ctx.reply(
          '⛔ Sizda administrator huquqi mavjud emas.',
          getUserKeyboard()
        );
      }
      return handler(ctx);
    };
  };

  // 🏢 Xonalar / Patoklar (Faqat Admin)
  bot.hears('🏢 Xonalar', requireAdmin(async (ctx) => {
    try {
      const roomsOverview = await studentService.getRoomsOverview();
      if (roomsOverview.rooms.length === 0) {
        return ctx.reply('🏢 Hozircha birorta ham xonada talaba ro\'yxatga olinmagan.', getAdminKeyboard());
      }

      let msg = `🏢 XONALAR (PATOKLAR) RO'YXATI\n\n`;
      msg += `Jami band xonalar soni: ${roomsOverview.totalRooms} ta\n\n`;

      roomsOverview.rooms.forEach((r) => {
        msg += `🏠 ${r.roomNumber}-XONA (${r.floor}-qavat): ${r.totalStudents} ta talaba (🟢 ${r.insideCount} | 🔴 ${r.outsideCount})\n`;
      });

      msg += `\nAniq bitta xonaga kirish va undagi bolalarni ko'rish uchun xona raqamini kiriting:`;
      await ctx.reply(msg);
      return ctx.scene.enter('ROOM_DETAIL_WIZARD');
    } catch (err) {
      logger.error('Xonalar menyusi xatosi:', err.message);
      await ctx.reply('❌ Xonalar ro\'yxatini olishda xatolik yuz berdi.', getAdminKeyboard());
    }
  }));

  // 🔍 Qidirish (Faqat Admin)
  bot.hears('🔍 Qidirish', requireAdmin((ctx) => {
    ctx.scene.enter('SEARCH_WIZARD');
  }));

  // 🚪 Kirish/Chiqish (Faqat Admin)
  bot.hears('🚪 Kirish/Chiqish', requireAdmin(async (ctx) => {
    try {
      const stats = await studentService.getDashboardStats();
      let text = `🚪 TALABALARNING KIRISH-CHIQISH HOLATI\n\n`;
      text += `🟢 Hozir yotoqxonada: ${stats.insideStudents} ta\n`;
      text += `🔴 Tashqarida / Chiqib ketgan: ${stats.outsideStudents} ta\n\n`;
      text += `Talabani holatini o'zgartirish uchun [🔍 Qidirish] orqali toping yoki [🏢 Xonalar] bo'limidan xonasini tanlang.`;

      await ctx.reply(text, getAdminKeyboard());
    } catch (err) {
      logger.error('Movement stats error:', err.message);
      await ctx.reply('❌ Ma\'lumotlarni olishda xatolik yuz berdi.', getAdminKeyboard());
    }
  }));

  // 👨🎓 Talabalar (Faqat Admin)
  bot.hears('👨🎓 Talabalar', requireAdmin(async (ctx) => {
    try {
      const stats = await studentService.getDashboardStats();
      if (stats.totalStudents === 0) {
        return ctx.reply(
          '👨🎓 Hozircha hech qanday talaba ro‘yxatga olinmagan.',
          getAdminKeyboard()
        );
      }

      const report = await studentService.getGroupedRoomReport();
      let text = `👨🎓 RO'YXATGA OLINGAN TALABALAR\n\nJami: ${stats.totalStudents} ta talaba (${stats.totalRooms} ta xona)\n\n`;

      for (const room of report.rooms.slice(0, 10)) {
        text += `🏠 ${room.roomNumber}-XONA (${room.studentsCount} ta):\n`;
        room.students.forEach((st) => {
          const stStatus = st.status === 'INSIDE' ? '🟢' : '🔴';
          text += `  • ${stStatus} ${st.lastName} ${st.firstName} (${st.direction})\n`;
        });
        text += '\n';
      }

      if (report.rooms.length > 10) {
        text += `...va yana ${report.rooms.length - 10} ta xona mavjud. Aniq xonani ko'rish uchun [🏢 Xonalar] ni bosing.`;
      }

      await ctx.reply(text, getAdminKeyboard());
    } catch (err) {
      logger.error('Talabalar ro\'yxatini olishda xatolik:', err.message);
      await ctx.reply('❌ Ma\'lumotlarni yuklashda xatolik yuz berdi.', getAdminKeyboard());
    }
  }));

  // 📊 Hisobot (Faqat Admin)
  bot.hears('📊 Hisobot', requireAdmin(async (ctx) => {
    try {
      const stats = await studentService.getDashboardStats();
      if (stats.totalStudents === 0) {
        return ctx.reply('📊 Hozircha hisobot yaratish uchun ma’lumot mavjud emas.', getAdminKeyboard());
      }

      const reportKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📄 PDF', 'export_pdf'),
          Markup.button.callback('📊 Excel', 'export_excel'),
        ],
        [Markup.button.callback('📑 Google Sheets', 'export_google_sheets')],
      ]);

      await ctx.reply(
        `📊 YOTOQXONA TALABALARI HISOBOTI\n\n` +
        `Jami talabalar soni: ${stats.totalStudents} ta\n` +
        `🟢 Yotoqxonada: ${stats.insideStudents} ta | 🔴 Tashqarida: ${stats.outsideStudents} ta\n` +
        `Jami band xonalar soni: ${stats.totalRooms} ta\n\n` +
        `Hisobot formatini tanlang:`,
        reportKeyboard
      );
    } catch (err) {
      logger.error('Hisobot menyusida xatolik:', err.message);
      await ctx.reply('❌ Hisobotni tayyorlashda xatolik yuz berdi.', getAdminKeyboard());
    }
  }));

  // Movement toggle callback handler
  bot.action(/^toggle_mov_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ Faqat adminlar holatni o\'zgartira oladi.', { show_alert: true });
    }

    const studentId = ctx.match[1];
    try {
      const result = await studentService.toggleMovement(studentId);
      await ctx.answerCbQuery(result.message, { show_alert: true });
      const newStatusIcon = result.student.status === 'INSIDE' ? '🟢 Yotoqxonada' : '🔴 Tashqarida';
      await ctx.reply(
        `✅ ${result.student.lastName} ${result.student.firstName} holati yangilandi:\n` +
        `Holati: ${newStatusIcon}\n` +
        `Xona: 🏠 ${result.student.roomNumber}`
      );
    } catch (err) {
      logger.error('Movement action error:', err.message);
      await ctx.answerCbQuery('❌ Xatolik yuz berdi.', { show_alert: true });
    }
  });

  // Inline Action: PDF (Faqat Admin)
  bot.action('export_pdf', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ Ruxsat berilmagan.', { show_alert: true });
    }

    try {
      await ctx.answerCbQuery('PDF hisobot tayyorlanmoqda...');
      await ctx.reply('📄 PDF hisobot generatsiya qilinmoqda, kuting...');

      const pdfBuffer = await reportService.generatePDF();
      await ctx.replyWithDocument(
        {
          source: pdfBuffer,
          filename: `yotoqxona_talabalari_${Date.now()}.pdf`,
        },
        {
          caption: '📄 Yotoqxona talabalari to\'liq PDF hisoboti (Xonalar bo\'yicha tartiblangan)',
        }
      );
    } catch (err) {
      logger.error('Bot PDF export xatosi:', err.message);
      await ctx.reply('❌ PDF generatsiya qilishda xatolik yuz berdi.');
    }
  });

  // Inline Action: Excel (Faqat Admin)
  bot.action('export_excel', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ Ruxsat berilmagan.', { show_alert: true });
    }

    try {
      await ctx.answerCbQuery('Excel fayl tayyorlanmoqda...');
      await ctx.reply('📊 Excel jadval generatsiya qilinmoqda, kuting...');

      const excelBuffer = await reportService.generateExcel();
      await ctx.replyWithDocument(
        {
          source: excelBuffer,
          filename: `yotoqxona_talabalari_${Date.now()}.xlsx`,
        },
        {
          caption: '📊 Yotoqxona talabalari Excel jadvali (.xlsx)',
        }
      );
    } catch (err) {
      logger.error('Bot Excel export xatosi:', err.message);
      await ctx.reply('❌ Excel faylini generatsiya qilishda xatolik yuz berdi.');
    }
  });

  // Inline Action: Google Sheets (Faqat Admin)
  bot.action('export_google_sheets', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ Ruxsat berilmagan.', { show_alert: true });
    }

    try {
      await ctx.answerCbQuery('Google Sheets ga eksport qilinmoqda...');
      await ctx.reply('📑 Google Sheets ga ma\'lumotlar yuklanmoqda, kuting...');

      const result = await googleSheetsService.exportToGoogleSheets();
      await ctx.reply(
        `✅ Ma'lumotlar Google Sheets jadvaliga muvaffaqiyatli eksport qilindi!\n\n` +
        `Jami talabalar: ${result.totalStudents} ta\n` +
        `Jami xonalar: ${result.totalRooms} ta\n\n` +
        `🔗 Havola: ${result.spreadsheetUrl}`
      );
    } catch (err) {
      logger.error('Bot Google Sheets export xatosi:', err.message);
      await ctx.reply(`⚠️ Google Sheets eksport xatosi: ${err.message || 'Xatolik yuz berdi'}`);
    }
  });

  bot.catch((err, ctx) => {
    logger.error(`[Telegram Bot Xatosi] Update ${ctx.updateType}:`, err);
  });

  return bot;
}

module.exports = {
  initBot,
  getBot: () => bot,
};
