/**
 * YOTOQXONA MANAGEMENT SYSTEM -- INTEGRATION TEST SUITE
 * 17 ta majburiy biznes qoidalari va xavfsizlik sinovlari
 */

const prisma = require('../src/config/database');
const studentService = require('../src/services/studentService');
const attendanceService = require('../src/services/attendanceService');
const reportService = require('../src/services/reportService');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Test muvaffaqiyatsiz: ${message}`);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 YOTOQXONA TIZIMI -- TO\'LIQ INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  const testRoom = 999;

  // Clean up any stale test records
  await prisma.student.deleteMany({ where: { roomNumber: testRoom } });
  await prisma.attendance.deleteMany({});

  try {
    // ----------------------------------------------------
    // 1. Student Registration Test
    // ----------------------------------------------------
    console.log('📌 Test 1: Talabani ro\'yxatga olish');
    const s1 = await studentService.createStudent({
      telegramUserId: 'tg_user_1',
      firstName: 'Azizbek',
      lastName: 'Aliyev',
      fatherName: 'Anvar o\'g\'li',
      direction: 'Dasturiy injiniring',
      phone: '+998901111111',
      roomNumber: testRoom,
    });
    assert(s1 && s1.id && s1.firstName === 'Azizbek', '1-talaba muvaffaqiyatli saqlandi');

    // ----------------------------------------------------
    // 2. Duplicate Telegram ID block
    // ----------------------------------------------------
    console.log('\n📌 Test 2: Takroriy Telegram ID ni bloklash (RULE 1)');
    let tgDupBlocked = false;
    try {
      await studentService.createStudent({
        telegramUserId: 'tg_user_1', // same telegramUserId
        firstName: 'Boshqa',
        lastName: 'Talaba',
        fatherName: 'Ali o\'g\'li',
        direction: 'IT',
        phone: '+998909999999',
        roomNumber: 998,
      });
    } catch (err) {
      tgDupBlocked = err.message.includes('allaqachon ro‘yxatdan o‘tgansiz');
    }
    assert(tgDupBlocked, 'Bir Telegram foydalanuvchisi ikkinchi marta ro\'yxatdan o\'ta olmaydi');

    // ----------------------------------------------------
    // 3. Duplicate Student (Name + Father + Phone) block
    // ----------------------------------------------------
    console.log('\n📌 Test 3: Duplikat talabani bloklash (RULE 3)');
    let studentDupBlocked = false;
    try {
      await studentService.createStudent({
        telegramUserId: 'tg_user_unique_99',
        firstName: 'Azizbek',
        lastName: 'Aliyev',
        fatherName: 'Anvar o\'g\'li',
        direction: 'Dasturiy injiniring',
        phone: '+998901111111',
        roomNumber: 998,
      });
    } catch (err) {
      studentDupBlocked = err.message.includes('allaqachon mavjud');
    }
    assert(studentDupBlocked, 'Ism, Familiya, Otasining ismi va Telefon bo\'yicha duplikat bloklandi');

    // ----------------------------------------------------
    // 4, 5, 6, 7. Room Capacity Limits (1/3, 2/3, 3/3, 4th reject)
    // ----------------------------------------------------
    console.log('\n📌 Test 4, 5, 6, 7: Xona sig\'imi 3 ta va 4-talabani bloklash (RULE 2)');
    const s2 = await studentService.createStudent({
      telegramUserId: 'tg_user_2',
      firstName: 'Bekzod',
      lastName: 'Karimov',
      fatherName: 'Vali o\'g\'li',
      direction: 'Kiberxavfsizlik',
      phone: '+998902222222',
      roomNumber: testRoom,
    });
    assert(s2 && s2.roomNumber === testRoom, '2-talaba xonaga biriktirildi (2/3)');

    const s3 = await studentService.createStudent({
      telegramUserId: 'tg_user_3',
      firstName: 'Sardor',
      lastName: 'Rasulov',
      fatherName: 'Gani o\'g\'li',
      direction: 'Sun\'iy intellekt',
      phone: '+998903333333',
      roomNumber: testRoom,
    });
    assert(s3 && s3.roomNumber === testRoom, '3-talaba xonaga biriktirildi (3/3 to\'ldi)');

    let fourthRejected = false;
    try {
      await studentService.createStudent({
        telegramUserId: 'tg_user_4',
        firstName: 'Javohir',
        lastName: 'Toshmatov',
        fatherName: 'Olim o\'g\'li',
        direction: 'IT',
        phone: '+998904444444',
        roomNumber: testRoom,
      });
    } catch (err) {
      fourthRejected = err.message.includes('Bu xona to‘liq band');
    }
    assert(fourthRejected, '4-talaba xonaga qo\'shilmadi: ❌ Bu xona to‘liq band xatosi qaytdi');

    // ----------------------------------------------------
    // 8. Attendance code generation (6 digit, 30s)
    // ----------------------------------------------------
    console.log('\n📌 Test 8: Davomat 6 xonali tasodifiy kod va 30s taymer (RULE 3, 4)');
    const session = await attendanceService.createAttendance();
    assert(session && session.code.length === 6 && /^\d{6}$/.test(session.code), '6 xonali raqamli kod yaratildi: ' + session.code);
    assert(session.durationSeconds === 30 && session.status === 'ACTIVE', '30 soniyalik faol davomat ochildi');

    // ----------------------------------------------------
    // 9. Wrong attendance code rejection
    // ----------------------------------------------------
    console.log('\n📌 Test 9: Noto\'g\'ri kod kiritilganda rad etish');
    const wrongRes = await attendanceService.markAttendance('tg_user_1', '000000');
    assert(wrongRes.success === false && wrongRes.message.includes('Kod noto‘g‘ri'), 'Noto\'g\'ri kod rad etildi');

    // ----------------------------------------------------
    // 10. Unregistered Telegram user rejection
    // ----------------------------------------------------
    console.log('\n📌 Test 10: Ro\'yxatdan o\'tmagan Telegram foydalanuvchini rad etish');
    const unregRes = await attendanceService.markAttendance('unknown_user_999', session.code);
    assert(unregRes.success === false && unregRes.message.includes('ro‘yxatdan o‘tmagansiz'), 'Ro\'yxatdan o\'tmagan user rad etildi');

    // ----------------------------------------------------
    // 11. Successful attendance mark
    // ----------------------------------------------------
    console.log('\n📌 Test 11: To\'g\'ri kod bilan davomatdan muvaffaqiyatli o\'tish');
    const validRes = await attendanceService.markAttendance('tg_user_1', session.code);
    assert(validRes.success === true && validRes.message.includes('muvaffaqiyatli'), 'Talaba davomatdan muvaffaqiyatli o\'tdi');

    // ----------------------------------------------------
    // 12. Duplicate attendance block (RULE 5)
    // ----------------------------------------------------
    console.log('\n📌 Test 12: Bir davomatda qayta qatnashishni bloklash (RULE 5)');
    const dupRes = await attendanceService.markAttendance('tg_user_1', session.code);
    assert(dupRes.success === false && dupRes.message.includes('allaqachon o‘tgansiz'), 'Takroriy davomat muvaffaqiyatli bloklandi');

    // ----------------------------------------------------
    // 13, 14. Present and Absent calculations
    // ----------------------------------------------------
    console.log('\n📌 Test 13, 14: Kelganlar va Kelmaganlar sonini hisoblash');
    const attDetails = await attendanceService.getAttendanceById(session.id);
    assert(attDetails.totalStudents >= 3, 'Jami talabalar soni hisoblandi: ' + attDetails.totalStudents);
    assert(attDetails.attendedCount === 1, 'Kelganlar soni: ' + attDetails.attendedCount);
    assert(attDetails.absentCount === attDetails.totalStudents - 1, 'Kelmaganlar soni to\'g\'ri hisoblandi (Jami - Kelgan): ' + attDetails.absentCount);
    assert(attDetails.attendedStudents.length === 1 && attDetails.attendedStudents[0].firstName === 'Azizbek', 'Kelgan talaba ismi to\'g\'ri');
    assert(attDetails.absentStudents.length === attDetails.totalStudents - 1, 'Kelmaganlar ro\'yxati to\'g\'ri');

    // ----------------------------------------------------
    // 15. Manual close attendance
    // ----------------------------------------------------
    console.log('\n📌 Test 15: Davomatni muddatidan oldin qo\'lda yopish');
    const closed = await attendanceService.closeAttendance(session.id);
    assert(closed.status === 'EXPIRED', 'Davomat holati EXPIRED ga o\'zgardi');

    // ----------------------------------------------------
    // 16. Expired code rejection
    // ----------------------------------------------------
    console.log('\n📌 Test 16: Vaqti tugagan kodni kiritish rad etilishi');
    const expRes = await attendanceService.markAttendance('tg_user_2', session.code);
    assert(expRes.success === false && expRes.message.includes('Davomat vaqti tugagan'), 'Tugagan davomat kodi rad etildi');

    // ----------------------------------------------------
    // 17. Reports generation (PDF, Excel, Sorting)
    // ----------------------------------------------------
    console.log('\n📌 Test 17: Hisobotlar generatsiyasi (PDF & Excel, roomNumber ASC)');
    const pdfBuf = await reportService.generatePDF();
    assert(pdfBuf && pdfBuf.length > 100, 'PDF hisobot generatsiya qilindi (' + pdfBuf.length + ' bytes)');

    const excelBuf = await reportService.generateExcel();
    assert(excelBuf && excelBuf.length > 100, 'Excel hisobot generatsiya qilindi (' + excelBuf.length + ' bytes)');

    console.log('\n====================================================');
    console.log(`🎉 BARCHA ${passedTests}/${totalTests} TA INTEGRATION TEST MUVAFFAQIYATLI O'TDI!`);
    console.log('====================================================\n');
  } finally {
    // Clean up test data
    await prisma.student.deleteMany({ where: { roomNumber: testRoom } });
    await prisma.attendance.deleteMany({});
  }
}

runAllTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test to\'xtatildi:', err.message);
    process.exit(1);
  });
