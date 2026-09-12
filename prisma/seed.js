const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    console.log(`[Seed] Boshlang'ich admin yaratildi: username=${adminUsername}`);
  } else {
    console.log(`[Seed] Admin allaqachon mavjud: username=${adminUsername}`);
  }

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
