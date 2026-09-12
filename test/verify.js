const { normalizePhoneNumber, parseRoomNumber, studentCreateSchema } = require('../src/utils/validation');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('🧪 ================= TIZIM TESTLARI BOSHLANDI ================= 🧪\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Phone validation tests
  assert(normalizePhoneNumber('+998901234567') === '+998901234567', 'Telefon: +998901234567 to\'g\'ri qabul qilindi');
  assert(normalizePhoneNumber('998901234567') === '+998901234567', 'Telefon: 998901234567 avtomatik +998901234567 ga o\'girildi');
  assert(normalizePhoneNumber('901234567') === '+998901234567', 'Telefon: 9 ta raqam (901234567) +998901234567 ga o\'girildi');
  assert(normalizePhoneNumber('+998 (90) 123-45-67') === '+998901234567', 'Telefon: bo\'shliq va qavsli format to\'g\'ri tozalandi');
  assert(normalizePhoneNumber('12345') === null, 'Telefon: noto\'g\'ri qisqa raqam rad etildi');
  assert(normalizePhoneNumber('salom') === null, 'Telefon: matn rad etildi');

  // 2. Room number validation tests
  assert(parseRoomNumber('101') === 101, 'Xona: "101" -> 101');
  assert(parseRoomNumber('205') === 205, 'Xona: "205" -> 205');
  assert(parseRoomNumber('abc') === null, 'Xona: "abc" matn rad etildi');
  assert(parseRoomNumber('-5') === null, 'Xona: manfiy son rad etildi');
  assert(parseRoomNumber('0') === null, 'Xona: 0 rad etildi');

  // 3. Schema validation tests
  const validStudent = {
    firstName: 'Azizbek',
    lastName: 'Aliyev',
    fatherName: 'Anvar o‘g‘li',
    direction: 'Dasturiy injiniring',
    phone: '+998901234567',
    roomNumber: '205',
  };

  const parsed = studentCreateSchema.safeParse(validStudent);
  assert(parsed.success === true, 'Talaba schema: 6 ta to\'g\'ri maydon qabul qilindi');

  const invalidStudent = {
    firstName: 'A', // too short
    lastName: 'Aliyev',
    fatherName: 'Anvar',
    direction: 'IT',
    phone: '123', // invalid
    roomNumber: 'abc', // invalid
  };

  const parsedInvalid = studentCreateSchema.safeParse(invalidStudent);
  assert(parsedInvalid.success === false, 'Talaba schema: noto\'g\'ri maydonlar to\'g\'ri rad etildi');

  // 4. Password hashing test
  const plainPassword = 'adminPassword123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  assert(isMatch === true, 'Xavfsizlik: bcrypt parol heshlash va tekshirish to\'g\'ri ishladi');

  // 5. Excel Generation test (0 students empty state & sample data)
  const reportService = require('../src/services/reportService');
  try {
    const emptyExcel = await reportService.generateExcel({ totalStudents: 0, totalRooms: 0, rooms: [] });
    assert(emptyExcel && emptyExcel.length > 0, 'Eksport: Bo\'sh holatdagi Excel (.xlsx) generatsiyasi muvaffaqiyatli');

    const sampleReportData = {
      totalStudents: 2,
      totalRooms: 1,
      rooms: [
        {
          roomNumber: 101,
          studentsCount: 2,
          students: [
            {
              firstName: 'Azizbek',
              lastName: 'Aliyev',
              fatherName: 'Anvar o‘g‘li',
              direction: 'Dasturiy injiniring',
              phone: '+998901234567',
              roomNumber: 101,
            },
            {
              firstName: 'Bekzod',
              lastName: 'Karimov',
              fatherName: 'Akmal o‘g‘li',
              direction: 'Kiberxavfsizlik',
              phone: '+998911234567',
              roomNumber: 101,
            },
          ],
        },
      ],
    };

    const filledExcel = await reportService.generateExcel(sampleReportData);
    assert(filledExcel && filledExcel.length > 0, 'Eksport: To\'ldirilgan Excel (.xlsx) generatsiyasi muvaffaqiyatli');
  } catch (err) {
    assert(false, `Eksport: Excel generatsiyasi xatosi: ${err.message}`);
  }

  // 6. PDF Generation test (0 students empty state & sample data)
  try {
    const emptyPdf = await reportService.generatePDF({ totalStudents: 0, totalRooms: 0, rooms: [] });
    assert(emptyPdf && emptyPdf.length > 0, 'Eksport: Bo\'sh holatdagi PDF generatsiyasi muvaffaqiyatli');

    const sampleReportData = {
      totalStudents: 1,
      totalRooms: 1,
      rooms: [
        {
          roomNumber: 101,
          studentsCount: 1,
          students: [
            {
              firstName: 'Azizbek',
              lastName: 'Aliyev',
              fatherName: 'Anvar o‘g‘li',
              direction: 'Dasturiy injiniring',
              phone: '+998901234567',
              roomNumber: 101,
            },
          ],
        },
      ],
    };

    const filledPdf = await reportService.generatePDF(sampleReportData);
    assert(filledPdf && filledPdf.length > 0, 'Eksport: To\'ldirilgan PDF generatsiyasi muvaffaqiyatli');
  } catch (err) {
    assert(false, `Eksport: PDF generatsiyasi xatosi: ${err.message}`);
  }

  console.log(`\n🏁 Testlar yakunlandi: ${passed} ta o'tdi, ${failed} ta xato.`);
}

runTests().catch(console.error);
