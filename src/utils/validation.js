const { z } = require('zod');

// Telefon raqamini normallashtirish va tekshirish
function normalizePhoneNumber(input) {
  if (!input) return null;
  // Faqat raqamlar va '+' belgisini qoldiramiz
  let cleaned = String(input).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('998') && !cleaned.startsWith('+998')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+998') && cleaned.length === 9) {
    cleaned = '+998' + cleaned;
  }

  // Standart format: +998 followed by 9 digits (+998901234567)
  const uzPhoneRegex = /^\+998\d{9}$/;
  if (uzPhoneRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
}

// Xona raqamini tekshirish (faqat musbat butun son)
function parseRoomNumber(input) {
  if (input === undefined || input === null) return null;
  const num = parseInt(String(input).trim(), 10);
  if (isNaN(num) || num <= 0 || !/^\d+$/.test(String(input).trim())) {
    return null;
  }
  return num;
}

// Zod schemas
const studentCreateSchema = z.object({
  telegramUserId: z.string().optional().nullable(),
  firstName: z.string().trim().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  lastName: z.string().trim().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
  fatherName: z.string().trim().min(2, "Otasining ismi kamida 2 ta belgidan iborat bo'lishi kerak"),
  direction: z.string().trim().min(2, "Yo'nalish nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: z.string().refine((val) => normalizePhoneNumber(val) !== null, {
    message: "Telefon raqami noto'g'ri. Format: +998901234567",
  }),
  roomNumber: z.union([z.number(), z.string()]).refine((val) => parseRoomNumber(val) !== null, {
    message: "Xona raqami faqat butun musbat son bo'lishi kerak (masalan: 101, 205)",
  }),
});

const studentUpdateSchema = studentCreateSchema.partial();

const loginSchema = z.object({
  username: z.string().trim().min(3, "Login kamida 3 ta belgidan iborat bo'lishi kerak"),
  password: z.string().min(4, "Parol kamida 4 ta belgidan iborat bo'lishi kerak"),
});

module.exports = {
  normalizePhoneNumber,
  parseRoomNumber,
  studentCreateSchema,
  studentUpdateSchema,
  loginSchema,
};
