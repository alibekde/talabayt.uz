const config = require('../config');
const logger = require('../utils/logger');

let botInstance = null;

function setBotInstance(bot) {
  botInstance = bot;
}

/**
 * Barcha Telegram adminlarga xabar yuborish
 */
async function notifyTelegramAdmins(message, extra = {}) {
  if (!botInstance) return;

  const adminIds = config.adminIds || [];
  if (adminIds.length === 0) return;

  for (const adminId of adminIds) {
    try {
      await botInstance.telegram.sendMessage(adminId, message, {
        parse_mode: 'HTML',
        ...extra,
      });
    } catch (err) {
      logger.warn(`Telegram adminga (${adminId}) xabar yuborishda xatolik:`, err.message);
    }
  }
}

/**
 * Yangi talaba qo'shilganda Telegram adminga xabar berish
 */
async function notifyNewStudent(student, source = 'Web Panel') {
  const msg =
    `🔔 <b>YANGI TALABA RO‘YXATGA OLINDI</b> (${source})\n\n` +
    `👤 <b>F.I.O:</b> ${student.lastName} ${student.firstName} ${student.fatherName}\n` +
    `🎓 <b>Yo‘nalishi:</b> ${student.direction}\n` +
    `🏠 <b>Xona:</b> ${student.roomNumber}-xona (${Math.floor(student.roomNumber / 100) || 1}-qavat)\n` +
    `📱 <b>Telefon:</b> <code>${student.phone}</code>\n` +
    `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`;

  await notifyTelegramAdmins(msg);
}

/**
 * Kirish/chiqish harakati qayd etilganda Telegram adminga xabar berish
 */
async function notifyMovement(student, status, source = 'Web Panel') {
  const isInside = status === 'INSIDE';
  const icon = isInside ? '🟢' : '🔴';
  const actionText = isInside ? 'Yotoqxonaga kirdi' : 'Yotoqxonadan chiqdi';

  const msg =
    `${icon} <b>HARAKAT QAYD ETILDI</b> (${source})\n\n` +
    `👤 <b>Talaba:</b> ${student.lastName} ${student.firstName}\n` +
    `🏠 <b>Xona:</b> ${student.roomNumber}-xona\n` +
    `📌 <b>Holati:</b> ${icon} ${actionText}\n` +
    `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`;

  await notifyTelegramAdmins(msg);
}

/**
 * Talaba o'chirilganda Telegram adminga xabar berish
 */
async function notifyStudentDeleted(student, source = 'Web Panel') {
  const msg =
    `🗑️ <b>TALABA TIZIMDAN O‘CHIRILDI</b> (${source})\n\n` +
    `👤 <b>Talaba:</b> ${student.lastName} ${student.firstName}\n` +
    `🏠 <b>Xonasi:</b> ${student.roomNumber}-xona\n` +
    `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`;

  await notifyTelegramAdmins(msg);
}

module.exports = {
  setBotInstance,
  notifyTelegramAdmins,
  notifyNewStudent,
  notifyMovement,
  notifyStudentDeleted,
};
