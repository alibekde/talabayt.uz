const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { password: hashedPassword },
    create: {
      username: adminUsername,
      password: hashedPassword,
    },
  });
  console.log(`[Seed] Admin paroli yangilandi/tasdiqlandi: username=${adminUsername}, password=${adminPassword}`);

  // Qat'iy talab: talabalar soni dastlab 0 ta bo'lishi kerak.
  const studentCount = await prisma.student.count();
  console.log(`[Seed] Bazadagi talabalar soni: ${studentCount} ta (Demo ma'lumotlar qo'shilmadi).`);
}

main()
  .catch((e) => {
    console.error('[Seed Xatosi]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
