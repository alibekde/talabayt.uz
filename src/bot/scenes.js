const { Scenes, Markup } = require('telegraf');
const { WizardScene } = Scenes;
const prisma = require('../config/database');
const studentService = require('../services/studentService');
const attendanceService = require('../services/attendanceService');
const { normalizePhoneNumber, parseRoomNumber } = require('../utils/validation');
const logger = require('../utils/logger');
const config = require('../config');

// Helper to check if a Telegram user ID is an admin
function isAdmin(userId) {
  if (!config.adminIds || config.adminIds.length === 0) return true; // if not set, allow admin mode during dev
  return config.adminIds.includes(String(userId));
}

// User vs Admin keyboards
const getUserKeyboard = () => {
  return Markup.keyboard([
    ['➕ Ro\'yxatdan o\'tish', '👤 Mening ma\'lumotlarim'],
    ['📋 Davomat'],
  ]).resize();
};

const getAdminKeyboard = () => {
  return Markup.keyboard([
    ['🌐 Web Admin Panel'],
    ['➕ Ro\'yxatdan o\'tish', '👤 Mening ma\'lumotlarim'],
    ['📋 Davomat', '📊 Hisobot'],
    ['🏢 Xonalar', '👨🎓 Talabalar'],
    ['🚪 Kirish/Chiqish', '🔍 Qidirish'],
  ]).resize();
};

const getMainKeyboardForUser = (userId) => {
  return isAdmin(userId) ? getAdminKeyboard() : getUserKeyboard();
};

// Keyboard helpers for form steps
const getStepKeyboard = (showContactBtn = false) => {
  const buttons = [];
  if (showContactBtn) {
    buttons.push([Markup.button.contactRequest('📱 Telefon raqamimni yuborish')]);
  }
  buttons.push([
    Markup.button.text('⬅️ Orqaga'),
    Markup.button.text('❌ Bekor qilish'),
  ]);
  return Markup.keyboard(buttons).resize();
};

const getConfirmKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Saqlash', 'save_student'),
      Markup.button.callback('✏️ Tahrirlash', 'edit_student'),
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_student')],
  ]);
};

// 6-bosqichli Talaba qo'shish Wizard Scene
const addStudentWizard = new WizardScene(
  'ADD_STUDENT_WIZARD',

  // 1/6: Ism & Takroriy ro'yxatdan o'tish tekshiruvi
  async (ctx) => {
    const userId = ctx.from?.id;

    // Telegram foydalanuvchisi allaqachon ro'yxatdan o'tganligini tekshirish
    if (userId && !isAdmin(userId)) {
      try {
        const existing = await prisma.student.findUnique({
          where: { telegramUserId: String(userId) },
        });

        if (existing) {
          await ctx.reply(
            `⚠️ Siz allaqachon ro‘yxatdan o‘tgansiz.\nSizning ma’lumotlaringiz tizimda mavjud.\n\n` +
            `👤 Ismi: ${existing.lastName} ${existing.firstName} ${existing.fatherName}\n` +
            `🎓 Yo‘nalishi: ${existing.direction}\n` +
            `🏠 Xona: ${existing.roomNumber}\n` +
            `📱 Telefon: ${existing.phone}`,
            getMainKeyboardForUser(userId)
          );
          return ctx.scene.leave();
        }
      } catch (err) {
        logger.error('Check existing tg user error:', err.message);
      }
    }

    ctx.wizard.state.student = {
      telegramUserId: userId ? String(userId) : null,
    };

    await ctx.reply(
      '1/6\nIsmingizni kiriting:',
      Markup.keyboard([['❌ Bekor qilish']]).resize()
    );
    return ctx.wizard.next();
  },

  // 2/6: Familiya
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
    if (text.length < 2) {
      await ctx.reply('❌ Ism kamida 2 ta belgidan iborat bo\'lishi kerak.\nQaytadan kiriting:');
      return;
    }

    ctx.wizard.state.student.firstName = text;
    await ctx.reply('2/6\nFamiliyangizni kiriting:', getStepKeyboard());
    return ctx.wizard.next();
  },

  // 3/6: Otasining ismi
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
    if (text === '⬅️ Orqaga') {
      await ctx.reply('1/6\nIsmingizni kiriting:', Markup.keyboard([['❌ Bekor qilish']]).resize());
      return ctx.wizard.back();
    }
    if (text.length < 2) {
      await ctx.reply('❌ Familiya kamida 2 ta belgidan iborat bo\'lishi kerak.\nQaytadan kiriting:');
      return;
    }

    ctx.wizard.state.student.lastName = text;
    await ctx.reply('3/6\nOtangizning ismini kiriting:', getStepKeyboard());
    return ctx.wizard.next();
  },

  // 4/6: Yo'nalishi
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
    if (text === '⬅️ Orqaga') {
      await ctx.reply('2/6\nFamiliyangizni kiriting:', getStepKeyboard());
      return ctx.wizard.back();
    }
    if (text.length < 2) {
      await ctx.reply('❌ Otasining ismi kamida 2 ta belgidan iborat bo\'lishi kerak.\nQaytadan kiriting:');
      return;
    }

    ctx.wizard.state.student.fatherName = text;
    await ctx.reply('4/6\nYo\'nalishingizni kiriting:', getStepKeyboard());
    return ctx.wizard.next();
  },

  // 5/6: Telefon raqami
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
    if (text === '⬅️ Orqaga') {
      await ctx.reply('3/6\nOtangizning ismini kiriting:', getStepKeyboard());
      return ctx.wizard.back();
    }
    if (text.length < 2) {
      await ctx.reply('❌ Yo\'nalish nomi kamida 2 ta belgidan iborat bo\'lishi kerak.\nQaytadan kiriting:');
      return;
    }

    ctx.wizard.state.student.direction = text;
    await ctx.reply(
      '5/6\nTelefon raqamingizni kiriting (masalan: +998901234567) yoki quyidagi tugmani bosing:',
      getStepKeyboard(true)
    );
    return ctx.wizard.next();
  },

  // 6/6: Xona raqami
  async (ctx) => {
    let phoneInput = null;

    if (ctx.message?.contact) {
      phoneInput = ctx.message.contact.phone_number;
    } else if (ctx.message?.text) {
      const text = ctx.message.text.trim();
      if (text === '❌ Bekor qilish') {
        await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
        return ctx.scene.leave();
      }
      if (text === '⬅️ Orqaga') {
        await ctx.reply('4/6\nYo\'nalishingizni kiriting:', getStepKeyboard());
        return ctx.wizard.back();
      }
      phoneInput = text;
    }

    const normalizedPhone = normalizePhoneNumber(phoneInput);
    if (!normalizedPhone) {
      await ctx.reply(
        '❌ Telefon raqami noto‘g‘ri.\nQaytadan kiriting (masalan: +998901234567):',
        getStepKeyboard(true)
      );
      return;
    }

    ctx.wizard.state.student.phone = normalizedPhone;
    await ctx.reply('6/6\nXona raqamingizni kiriting (masalan: 101, 205, 420):', getStepKeyboard());
    return ctx.wizard.next();
  },

  // 7: Tasdiqlash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
    if (text === '⬅️ Orqaga') {
      await ctx.reply('5/6\nTelefon raqamingizni kiriting:', getStepKeyboard(true));
      return ctx.wizard.back();
    }

    const parsedRoom = parseRoomNumber(text);
    if (!parsedRoom) {
      await ctx.reply('❌ Xona raqami noto‘g‘ri. Faqat raqam kiriting (masalan: 101, 205, 420):', getStepKeyboard());
      return;
    }

    // Xona sig'imini tekshirish (ko'pi bilan 3 ta talaba)
    try {
      const roomInfo = await studentService.getRoomDetails(parsedRoom);
      if (roomInfo.totalStudents >= 3) {
        await ctx.reply(
          `❌ Bu xona to‘liq band. Xonada maksimal 3 ta talaba bo‘lishi mumkin.\n\nIltimos, boshqa bo'sh xona raqamini kiriting:`,
          getStepKeyboard()
        );
        return;
      }
    } catch (err) {
      // room not found or other non-critical check
    }

    ctx.wizard.state.student.roomNumber = parsedRoom;
    const s = ctx.wizard.state.student;

    const summaryText =
      `📋 MA'LUMOTLARINGIZ\n\n` +
      `Ismi: ${s.firstName}\n` +
      `Familiyasi: ${s.lastName}\n` +
      `Otasining ismi: ${s.fatherName}\n` +
      `Yo'nalishi: ${s.direction}\n` +
      `Telefon: ${s.phone}\n` +
      `Xona: ${s.roomNumber}\n\n` +
      `Ma'lumotlarni saqlaysizmi?`;

    const confirmButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Tasdiqlash', 'save_student'),
        Markup.button.callback('✏️ Tahrirlash', 'edit_student'),
      ],
      [Markup.button.callback('❌ Bekor qilish', 'cancel_student')],
    ]);

    await ctx.reply('Ma\'lumotlar qabul qilindi.', getMainKeyboardForUser(ctx.from?.id));
    await ctx.reply(summaryText, confirmButtons);
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (ctx.message?.text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }
  }
);

addStudentWizard.action('save_student', async (ctx) => {
  try {
    await ctx.answerCbQuery('Saqlanmoqda...');
    const s = ctx.wizard.state.student;
    if (!s || !s.firstName) {
      await ctx.reply('⚠️ Ma\'lumotlar topilmadi. Qaytadan urinib ko\'ring.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }

    if (!s.telegramUserId && ctx.from?.id) {
      s.telegramUserId = String(ctx.from.id);
    }

    const saved = await studentService.createStudent(s);
    await ctx.editMessageText(
      `✅ Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!\n\n` +
      `Sizning ma'lumotlaringiz tizimga saqlandi.`
    );
    await ctx.reply('Bosh menyu:', getMainKeyboardForUser(ctx.from?.id));
  } catch (error) {
    logger.error('Bot save_student xatosi:', error.message);
    if (error.statusCode === 409 || error.message.includes('allaqachon mavjud') || error.message.includes('allaqachon ro‘yxatdan o‘tgansiz') || error.message.includes('allaqachon ro\'yxatdan o\'tgansiz')) {
      await ctx.reply(`⚠️ ${error.message}`, getMainKeyboardForUser(ctx.from?.id));
    } else {
      await ctx.reply(`❌ Xatolik: ${error.message || 'Saqlashda xatolik yuz berdi.'}`, getMainKeyboardForUser(ctx.from?.id));
    }
  }
  return ctx.scene.leave();
});

addStudentWizard.action('edit_student', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('✏️ Qaytadan kiritish boshlandi.');
  await ctx.scene.reenter();
});

addStudentWizard.action('cancel_student', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('❌ Bekor qilindi.');
  await ctx.reply('Bosh menyu:', getMainKeyboardForUser(ctx.from?.id));
  return ctx.scene.leave();
});

// Davomat Scene (Talaba kod kiritib davomatdan o'tishi)
const attendanceWizard = new WizardScene(
  'ATTENDANCE_WIZARD',
  async (ctx) => {
    const userId = ctx.from?.id;

    // 1. Foydalanuvchi ro'yxatdan o'tganmi?
    if (!userId) {
      await ctx.reply('❌ Telegram foydalanuvchi ma\'lumoti topilmadi.', getUserKeyboard());
      return ctx.scene.leave();
    }

    const student = await prisma.student.findUnique({
      where: { telegramUserId: String(userId) },
    });

    if (!student) {
      await ctx.reply(
        `❌ Siz tizimda ro‘yxatdan o‘tmagansiz.\nAvval ro‘yxatdan o‘tishingiz kerak.`,
        getUserKeyboard()
      );
      return ctx.scene.leave();
    }

    // 2. Faol davomat mavjudmi?
    const active = await prisma.attendance.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) {
      await ctx.reply('⏰ Hozirda faol davomat mavjud emas.', getMainKeyboardForUser(userId));
      return ctx.scene.leave();
    }

    const remainingSeconds = Math.max(0, Math.ceil((new Date(active.expiresAt).getTime() - Date.now()) / 1000));
    if (remainingSeconds <= 0) {
      await ctx.reply('⏰ Davomat vaqti tugagan.', getMainKeyboardForUser(userId));
      return ctx.scene.leave();
    }

    // 3. Kod so'rash
    await ctx.reply(
      `📋 Davomat\n\n🔐 Davomat kodini kiriting:\n⏱ Qolgan vaqt: ${remainingSeconds} soniya`,
      Markup.keyboard([['❌ Bekor qilish']]).resize()
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const text = ctx.message?.text?.trim();
    const userId = ctx.from?.id;

    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Davomat bekor qilindi.', getMainKeyboardForUser(userId));
      return ctx.scene.leave();
    }

    // Kodni tekshirish va qayd etish
    try {
      const result = await attendanceService.markAttendance(userId, text);
      await ctx.reply(result.message, getMainKeyboardForUser(userId));
    } catch (err) {
      logger.error('Bot mark attendance error:', err.message);
      await ctx.reply('❌ Davomatni tekshirishda xatolik yuz berdi.', getMainKeyboardForUser(userId));
    }

    return ctx.scene.leave();
  }
);

// Qidirish Scene (Faqat Admin uchun)
const searchWizard = new WizardScene(
  'SEARCH_WIZARD',
  async (ctx) => {
    await ctx.reply(
      '🔍 Qidirmoqchi bo\'lgan talabaning ismi, familiyasi, yo\'nalishi, telefoni yoki xona raqamini kiriting:',
      Markup.keyboard([['❌ Bekor qilish']]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Qidiruv bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }

    try {
      const result = await studentService.getAllStudents({ search: text, limit: 10 });
      if (result.data.length === 0) {
        await ctx.reply(`🔍 "${text}" bo'yicha hech qanday talaba topilmadi.`, getMainKeyboardForUser(ctx.from?.id));
      } else {
        let msg = `🔍 Qidiruv natijalari (${result.pagination.total} ta topildi):\n\n`;
        result.data.forEach((st, idx) => {
          const statusIcon = st.status === 'INSIDE' ? '🟢 Yotoqxonada' : '🔴 Tashqarida';
          msg += `${idx + 1}. 👤 ${st.lastName} ${st.firstName} ${st.fatherName}\n`;
          msg += `   🎓 Yo‘nalishi: ${st.direction}\n`;
          msg += `   📱 Telefon: ${st.phone}\n`;
          msg += `   🏠 Xona: ${st.roomNumber} | Holati: ${statusIcon}\n\n`;
        });
        await ctx.reply(msg, getMainKeyboardForUser(ctx.from?.id));
      }
    } catch (err) {
      logger.error('Bot qidiruv xatosi:', err.message);
      await ctx.reply('❌ Qidiruvda xatolik yuz berdi.', getMainKeyboardForUser(ctx.from?.id));
    }
    return ctx.scene.leave();
  }
);

// Xona bo'yicha qidirish Scene (420-xona kabi)
const roomDetailWizard = new WizardScene(
  'ROOM_DETAIL_WIZARD',
  async (ctx) => {
    await ctx.reply(
      '🏢 Xona raqamini kiriting (masalan: 101, 205, 420):',
      Markup.keyboard([['❌ Bekor qilish']]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text === '❌ Bekor qilish') {
      await ctx.reply('Amal bekor qilindi.', getMainKeyboardForUser(ctx.from?.id));
      return ctx.scene.leave();
    }

    const roomNum = parseRoomNumber(text);
    if (!roomNum) {
      await ctx.reply('❌ Xona raqami noto\'g\'ri. Faqat raqam kiriting (masalan: 420):');
      return;
    }

    try {
      const roomData = await studentService.getRoomDetails(roomNum);
      if (roomData.totalStudents === 0) {
        await ctx.reply(`🏠 ${roomNum}-xonada hozircha hech qanday talaba ro'yxatga olinmagan.`, getMainKeyboardForUser(ctx.from?.id));
      } else {
        let msg = `🏠 ${roomNum}-XONA TAFSILOTI\n\n`;
        msg += `📊 Jami talabalar soni: ${roomData.totalStudents} ta\n`;
        msg += `🟢 Yotoqxonada: ${roomData.insideCount} ta  |  🔴 Tashqarida: ${roomData.outsideCount} ta\n\n`;
        msg += `Talabalar ro'yxati:\n`;

        roomData.students.forEach((st, idx) => {
          const stStatus = st.status === 'INSIDE' ? '🟢 Yotoqxonada' : '🔴 Tashqarida';
          msg += `\n${idx + 1}. 👤 ${st.lastName} ${st.firstName} ${st.fatherName}\n`;
          msg += `   🎓 ${st.direction}\n`;
          msg += `   📱 ${st.phone}\n`;
          msg += `   Holati: ${stStatus}\n`;
        });

        // Inline toggle buttons for each student in room
        const toggleButtons = roomData.students.map((st) => [
          Markup.button.callback(
            `${st.status === 'INSIDE' ? '🔴 Chiqdi' : '🟢 Kirdi'}: ${st.firstName}`,
            `toggle_mov_${st.id}`
          ),
        ]);

        await ctx.reply(msg, getMainKeyboardForUser(ctx.from?.id));
        if (toggleButtons.length > 0) {
          await ctx.reply('Xonadagilar holatini o\'zgartirish (Kirib ketdi / Chiqib ketdi):', Markup.inlineKeyboard(toggleButtons));
        }
      }
    } catch (err) {
      logger.error('Room details error:', err.message);
      await ctx.reply('❌ Xona ma\'lumotlarini yuklashda xatolik yuz berdi.', getMainKeyboardForUser(ctx.from?.id));
    }
    return ctx.scene.leave();
  }
);

module.exports = {
  addStudentWizard,
  searchWizard,
  roomDetailWizard,
  attendanceWizard,
  isAdmin,
  getUserKeyboard,
  getAdminKeyboard,
  getMainKeyboardForUser,
};
