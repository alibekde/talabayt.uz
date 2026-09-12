# 🏠 YOTOQXONA MANAGEMENT SYSTEM (TALABAYT.UZ)

Production-ready, to'liq ishlaydigan Full-Stack Yotoqxona Boshqaruv va 30 Soniyalik Jonli Davomat Tizimi.

---

## 📑 MUNDARIJA

1. [Loyiha Haqida](#1-loyiha-haqida)
2. [Arxitektura va Texnologiyalar](#2-arxitektura-va-texnologiyalar)
3. [Loyiha Fayllar Strukturasi](#3-loyiha-fayllar-strukturasi)
4. [Database Schema (Prisma & PostgreSQL)](#4-database-schema-prisma--postgresql)
5. [Qat'iy Biznes Qoidalari](#5-qatiy-biznes-qoidalari)
6. [Telegram Bot Oqimi (Flow)](#6-telegram-bot-oqimi-flow)
7. [Admin Panel Oqimi (Flow)](#7-admin-panel-oqimi-flow)
8. [30 Soniyalik Jonli Davomat Arxitekturasi](#8-30-soniyalik-jonli-davomat-arxitekturasi)
9. [Hisobotlar Generatsiyasi (PDF, Excel, Google Sheets)](#9-hisobotlar-generatsiyasi-pdf-excel-google-sheets)
10. [API Endpoints](#10-api-endpoints)
11. [Xavfsizlik va Concurrency](#11-xavfsizlik-va-concurrency)
12. [Muhit O'zgaruvchilari (.env)](#12-muhit-ozgaruvchilari-env)
13. [O'rnatish va Ishga Tushirish (Development & Production)](#13-ornatish-va-ishga-tushirish-development--production)
14. [Avtomatlashtirilgan Testlar](#14-avtomatlashtirilgan-testlar)
15. [Zaxira Nusxalash (Database Backup) & Troubleshooting](#15-zaxira-nusxalash-database-backup--troubleshooting)

---

## 1. LOYIHA HAQIDA

Tizim yotoqxonadagi talabalarni Telegram bot orqali ro'yxatdan o'tkazish, har bir xonaga maksimal 3 nafardan talaba biriktirish, administrator orqali Web boshqaruv panelida to'liq nazorat qilish, eksport hisobotlarini olish hamda 30 soniyalik dinamik kod asosida real vaqtda jonli davomat olish uchun mo'ljallangan.

---

## 2. ARXITEKTURA VA TEXNOLOGIYALAR

```
                    ┌─────────────────────────┐
                    │      TELEGRAM BOT       │
                    │   (@talabayt_bot)       │
                    └────────────┬────────────┘
                                 │
                       Registration & Code
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       BACKEND API       │
                    │ Node.js / Express / REST│
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
       ┌─────────────────┐              ┌───────────────────┐
       │   PostgreSQL    │              │    Real-Time      │
       │     Prisma      │              │  Live SSE Stream  │
       └─────────────────┘              └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │    ADMIN PANEL    │
                                        │  React / Tailwind │
                                        └───────────────────┘
                                                  │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   ▼
                            PDF                 Excel           Google Sheets
```

- **Backend:** Node.js, Express, REST API, Zod validation, Helmet, CORS, Rate-limiting.
- **ORM & Database:** Prisma ORM, PostgreSQL (ACID Transactions, Unique constraints, Indexed queries).
- **Telegram Bot:** Telegraf 4.x, FSM Wizard Stages, Session state.
- **Frontend (Admin Panel):** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Server-Sent Events (SSE).
- **Real-Time Engine:** Server-Sent Events (SSE) `/api/attendance/live-stream` (Avtomatik qayta ulanish, instant counts).
- **Exporting:** PDFKit (A4 chiziqli jadval), ExcelJS (.xlsx autofit + frozen headers), Google Sheets API (Batch update).

---

## 3. LOYIHA FAYLLAR STRUKTURASI

```
talabalar-royhati/
├── frontend/                     # Web Admin Panel (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/           # UI Komponentlar (Sidebar, BottomNav, Toast, StudentModal)
│   │   ├── context/              # AuthContext, ThemeContext (Dark/Light mode)
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx # Jonli statistika va xonalar bandligi
│   │   │   ├── AttendancePage.jsx# 30s Davomat, jonli countdown, Kelgan/Kelmaganlar
│   │   │   ├── RoomsPage.jsx     # Xonalar (Patoklar), 3-o'rinli krovat griddi
│   │   │   ├── StudentsPage.jsx  # Talabalar ro'yxati, qidiruv, filtr, sahifalash
│   │   │   ├── LogsPage.jsx      # Kirish-chiqish harakatlari tarixi
│   │   │   ├── ReportsPage.jsx   # PDF, Excel va Google Sheets eksporti
│   │   │   └── LoginPage.jsx     # Admin autentifikatsiyasi
│   │   ├── services/api.js       # Axios interseptorlar bilan
│   │   ├── App.jsx               # React Router Marshrutlash
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── prisma/
│   ├── schema.prisma             # PostgreSQL ma'lumotlar bazasi modellari
│   └── seed.js                   # Boshlang'ich admin konfiguratsiyasi
├── src/
│   ├── bot/
│   │   ├── index.js              # Telegram bot asosiy konfiguratsiyasi va buyruqlar
│   │   └── scenes.js             # 6 bosqichli ro'yxatdan o'tish va davomat FSM sahnalari
│   ├── config/
│   │   ├── database.js           # Prisma client singleton
│   │   └── index.js              # Konfiguratsiya va ENV yuklagich
│   ├── controllers/
│   │   ├── authController.js     # Login, logout, profil
│   │   ├── studentController.js  # CRUD, qidiruv, xonalar, harakatlar
│   │   ├── attendanceController.js# Davomat ochish, yopish, tekshirish, jonli SSE
│   │   └── reportController.js   # PDF va Excel generatsiyasi
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT token tekshiruvi
│   │   ├── errorHandler.js       # Markaziy xatolik tutuvchi
│   │   └── rateLimiter.js        # API so'rovlar limitlagichi
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── reportRoutes.js
│   ├── services/
│   │   ├── studentService.js     # Talabalar biznes mantig'i va 3-kishilik xona nazorati
│   │   ├── attendanceService.js  # 30s kod generatsiyasi, taymer, jonli broadcast
│   │   ├── notificationService.js# Telegram adminlarga jonli xabarnomalar
│   │   ├── reportService.js      # PDFKit va ExcelJS hisobot generatori
│   │   └── googleSheetsService.js# Google Sheets API integratsiyasi
│   ├── utils/
│   │   ├── logger.js             # Xavfsiz log yuritish
│   │   └── validation.js         # Zod va telefon/xona tekshiruvlari
│   └── index.js                  # Express backend server kirish nuqtasi
├── scripts/
│   └── verify-all.js             # 21 ta to'liq integration testlar to'plami
├── docker-compose.yml            # PostgreSQL va App konteynerlari
├── .env.example                  # Muhit o'zgaruvchilari namunasi
├── package.json
└── README.md
```

---

## 4. DATABASE SCHEMA (PRISMA & POSTGRESQL)

```prisma
model Student {
  id             String             @id @default(uuid())
  telegramUserId String?            @unique @map("telegram_user_id")
  firstName      String             @map("first_name")
  lastName       String             @map("last_name")
  fatherName     String             @map("father_name")
  direction      String
  phone          String
  roomNumber     Int                @map("room_number")
  status         String             @default("INSIDE") // "INSIDE" yoki "OUTSIDE"
  lastMovementAt DateTime           @default(now()) @map("last_movement_at")
  createdAt      DateTime           @default(now()) @map("created_at")
  updatedAt      DateTime           @updatedAt @map("updated_at")
  movementLogs   MovementLog[]
  attendanceRecords AttendanceRecord[]

  @@index([roomNumber])
  @@index([firstName])
  @@index([lastName])
  @@index([phone])
  @@index([status])
  @@map("students")
}

model Attendance {
  id        String             @id @default(uuid())
  code      String
  startedAt DateTime           @default(now()) @map("started_at")
  expiresAt DateTime           @map("expires_at")
  status    String             @default("ACTIVE") // "ACTIVE", "EXPIRED", "COMPLETED"
  createdAt DateTime           @default(now()) @map("created_at")
  records   AttendanceRecord[]

  @@index([status])
  @@index([createdAt])
  @@map("attendances")
}

model AttendanceRecord {
  id           String     @id @default(uuid())
  attendanceId String     @map("attendance_id")
  attendance   Attendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  studentId    String     @map("student_id")
  student      Student    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  markedAt     DateTime   @default(now()) @map("marked_at")

  @@unique([attendanceId, studentId])
  @@index([attendanceId])
  @@index([studentId])
  @@map("attendance_records")
}
```

---

## 5. QAT'IY BIZNES QOIDALARI

1. **RULE 1 (Telegram User faqat 1 marta):** `telegramUserId` database'da UNIQUE. Qayta urinishda `⚠️ Siz allaqachon ro‘yxatdan o‘tgansiz.` deb mavjud ma'lumotlari ko'rsatiladi.
2. **RULE 2 (Xona sig'imi maksimal 3 kishi):** Har bir xonada ko'pi bilan 3 nafar talaba bo'lishi mumkin. 4-talaba qo'shilishi backend darajasida qat'iy bloklanadi: `❌ Bu xona to‘liq band. Xonada maksimal 3 ta talaba bo‘lishi mumkin.`
3. **RULE 3 (Duplikat talabani bloklash):** `firstName + lastName + fatherName + phone` kombinatsiyasi bo'yicha tizimda mavjud bo'lgan talaba qayta qo'shilmaydi.
4. **RULE 4 (6 xonali tasodifiy kod va 30 soniya):** Davomat ochilganda tizim 6 xonali tasodifiy kod yaratadi va faqat 30 soniya amal qiladi.
5. **RULE 5 (Bir davomatda faqat 1 marta):** `AttendanceRecord(attendanceId, studentId)` unique constraint tufayli bir talaba bitta davomatda faqat 1 marta qatnasha oladi.
6. **RULE 6 (Tartibli hisobotlar):** Hisobotlar har doim `roomNumber ASC` bo'yicha tartiblanadi, xonalar ichidagi talabalar `1, 2, 3` tartibida raqamlanadi.

---

## 6. TELEGRAM BOT OQIMI (FLOW)

### Talaba Rejimi:
- `/start` $\rightarrow$ Agar ro'yxatdan o'tgan bo'lsa: salomlashib, menyuni chiqaradi. Agar ro'yxatdan o'tmagan bo'lsa: `➕ Ro'yxatdan o'tish` taklif qilinadi.
- **6 Bosqichli Ro'yxatdan O'tish FSM:**
  1. `1/6 Ismi`
  2. `2/6 Familiyasi`
  3. `3/6 Otasining ismi`
  4. `4/6 Yo‘nalishi`
  5. `5/6 Telefon raqami` (+998...) yoki kontakt yuborish
  6. `6/6 Xona raqami` (Masalan: 101, 205 — 3 kishilik limit tekshiriladi)
  - Tasdiqlash: `✅ Tasdiqlash` | `✏️ Tahrirlash` | `❌ Bekor qilish`
  - Saqlangach: `✅ Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!`
- **`👤 Mening ma'lumotlarim`:** Ro'yxatga olingan barcha ma'lumotlarni ko'rsatadi.
- **`📋 Davomat`:** Faol davomat mavjud bo'lsa, qolgan soniyani ko'rsatib, 6 xonali kodni so'raydi. Kod to'g'ri kiritilsa, davomat qayd etiladi.

### Admin Rejimi (`ADMIN_IDS`):
- `🌐 Web Admin Panel` (Telegram WebApp orqali to'g'ridan-to'g'ri ochish)
- `📋 Davomat`, `➕ Ro'yxatdan o'tish`, `🏢 Xonalar`, `👨🎓 Talabalar`, `🚪 Kirish/Chiqish`, `📊 Hisobot`

---

## 7. ADMIN PANEL OQIMI (FLOW)

- **/login:** Login (`admin`) va Parol (`admin123`) orqali xavfsiz JWT autentifikatsiyasi.
- **/dashboard:** Jami talabalar, Yotoqxonadagilar, Tashqaridagilar, Band xonalar soni va har bir xonaning bandlik holati (`101: 3/3`, `102: 2/3`, `103: 1/3`).
- **/attendance:**
  - `[➕ Yangi davomat ochish]` $\rightarrow$ 6 xonali kod va 30 soniyalik progress bar.
  - Jonli hisob: `👥 Jami: 120`, `✅ Kelgan: 97`, `❌ Kelmagan: 23`.
  - `[❌ Kelmaganlar]` va `[✅ Kelganlar]` to'liq jadvallari (Ismi, Yo'nalishi, Xona, Telefon).
  - `[📋 Davomat tarixi]` $\rightarrow$ barcha o'tgan davomatlarni ko'rish.
  - `[⏹ Davomatni yopish]` $\rightarrow$ 30 soniya tugamasdan oldin qo'lda yakunlash.
- **/students:** Talabalar jadvali, server-side sahifalash (10, 20, 50, 100), global qidiruv, xona filtri, tahrirlash va o'chirish.
- **/rooms:** Qavatlar bo'yicha filtrlanadigan 3 o'rinli vizual krovat griddi va yangi xona ochish.
- **/reports:** PDF, Excel va Google Sheets eksporti.

---

## 8. 30 SONIYALIK JONLI DAVOMAT ARXITEKTURASI

```
Admin Web Panel                   Backend Service                 Telegram Bot (Talaba)
     │                                   │                                  │
     │── 1. POST /api/attendance/start ─>│                                  │
     │                                   │── 2. Create 6-digit Code         │
     │                                   │── 3. Start 30s Expiry Timer      │
     │<── 4. SSE: attendance_started ────│                                  │
     │                                   │                                  │
     │                                   │<── 5. Talaba kod kiritadi ───────│
     │                                   │── 6. Check Active & Time & User  │
     │                                   │── 7. Save AttendanceRecord       │
     │<── 8. SSE: attendance_updated ────│                                  │
     │   (Kelgan +1, Kelmagan -1)        │── 9. ✅ Muvaffaqiyatli javob ────>│
     │                                   │                                  │
     │                                   │── 10. 30s Timer Tugaydi          │
     │<── 11. SSE: attendance_expired ───│                                  │
     │   (Status: EXPIRED)               │                                  │
```

---

## 9. HISOBOTLAR GENERATSIYASI (PDF, EXCEL, GOOGLE SHEETS)

- **PDF Export (`/api/reports/pdf`):** A4 formatida chiziqli professional jadval. Xonalar bo'yicha o'sish tartibida (`101`, `102`, `103`...), har xona ichidagi talabalar `1, 2, 3` qilib raqamlangan.
- **Excel Export (`/api/reports/excel`):** `.xlsx` fayl. Sarlavha qatori qotirilgan (Freeze Panes), Auto-filter yoqilgan, ustunlar o'lchamlari avtomatik moslashtirilgan, telefon raqamlari tekst formatida.
- **Google Sheets (`/api/reports/google-sheets`):** Google Sheets API v4 orqali barcha qatorlar bitta `batchUpdate` so'rovi bilan jadvalga yoziladi.

---

## 10. API ENDPOINTS

### Autentifikatsiya:
- `POST /api/auth/login` — Admin login (username, password)
- `GET /api/auth/me` — Profil ma'lumotlari
- `POST /api/auth/logout` — Tizimdan chiqish

### Talabalar:
- `GET /api/students` — Sahifalangan talabalar ro'yxati (`page`, `limit`, `search`, `roomNumber`, `status`)
- `POST /api/students` — Yangi talaba qo'shish (3 kishilik limit tekshiruvi bilan)
- `GET /api/students/:id` — Bitta talaba ma'lumotlari
- `PATCH /api/students/:id` — Talabani tahrirlash
- `DELETE /api/students/:id` — Talabani o'chirish
- `GET /api/students/stats` — Dashboard statistikasi
- `GET /api/students/rooms` — Xonalar umumiy ko'rinishi
- `GET /api/students/rooms/:roomNumber` — Bitta xona tafsilotlari
- `POST /api/students/:id/movement` — Kirib/chiqib ketish holatini o'zgartirish

### Davomat:
- `GET /api/attendance/live-stream` — Real-time Server-Sent Events (SSE) oqimi
- `GET /api/attendance/active` — Hozirgi faol davomat holati
- `POST /api/attendance/start` — Yangi 30 soniyalik davomat ochish
- `POST /api/attendance/close` — Davomatni qo'lda yopish
- `GET /api/attendance/history` — Davomatlar tarixi
- `GET /api/attendance/:id` — Bitta davomatning to'liq natijasi (Kelgan/Kelmaganlar)
- `POST /api/attendance/mark` — Kod orqali davomatdan o'tish

### Hisobotlar:
- `GET /api/reports/pdf` — PDF hisobot yuklab olish
- `GET /api/reports/excel` — Excel hisobot yuklab olish
- `POST /api/reports/google-sheets` — Google Sheets jadvaliga eksport qilish

---

## 11. XAVFSIZLIX VA CONCURRENCY

- **Parollar:** bcrypt bilan 10 salt rounds asosida xeshlanadi.
- **SQL Injection:** Prisma ORM parametrlashtirilgan so'rovlari orqali 100% himoyalangan.
- **Room Capacity Concurrency:** Xona sig'imi tekshiruvi backend transaction va database count orqali amalga oshiriladi.
- **Rate Limiting:** Express-rate-limit orqali spam va brute-force hujumlar bloklangan.
- **Log Xavfsizligi:** Parollar, telefon raqamlari, bot tokeni va JWT sirlari loglarga yozilmaydi.

---

## 12. MUHIT O'ZGARUVCHILARI (.env)

```env
# SERVER
PORT=5000
NODE_ENV=development

# DATABASE
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yotoqxona_db?schema=public"

# AUTH
JWT_SECRET="super-secret-jwt-key-change-in-production-yotoqxona-2026"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# TELEGRAM BOT
BOT_TOKEN="8915266738:AAFWHSOnYwmFHwsjCaMs689bMSMN7k-4GkM"
ADMIN_IDS="6556683612"
WEBHOOK_URL=""
WEBAPP_URL="https://talabayt-uz.vercel.app"

# GOOGLE SHEETS (Ixtiyoriy)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://developers.google.com/oauthplayground"
GOOGLE_REFRESH_TOKEN=""
GOOGLE_SPREADSHEET_ID=""
```

---

## 13. O'RNATISH VA ISHGA TUSHIRISH (DEVELOPMENT & PRODUCTION)

### 1. Bog'liqliklarni o'rnatish:
```bash
npm install
npm --prefix frontend install
```

### 2. Ma'lumotlar bazasi migratsiyasi:
```bash
npx prisma db push
```

### 3. Frontendni build qilish:
```bash
npm run build:frontend
```

### 4. Development rejimida ishga tushirish:
```bash
# Backend va Telegram Bot
npm run dev

# Frontend (alohida dev server)
cd frontend && npm run dev
```

### 5. Production rejimida ishga tushirish (Docker bilan):
```bash
docker-compose up -d --build
```

---

## 14. AVTOMATLASHTIRILGAN TESTLAR

Loyihada barcha 21 ta asosiy talab va biznes qoidalari uchun to'liq integratsiya testlari mavjud:

```bash
node scripts/verify-all.js
```

**Test natijalari:**
```
====================================================
🚀 YOTOQXONA TIZIMI -- TO'LIQ INTEGRATION TEST SUITE
====================================================

📌 Test 1: Talabani ro'yxatga olish
  ✅ [PASS] 1-talaba muvaffaqiyatli saqlandi

📌 Test 2: Takroriy Telegram ID ni bloklash (RULE 1)
  ✅ [PASS] Bir Telegram foydalanuvchisi ikkinchi marta ro'yxatdan o'ta olmaydi

📌 Test 3: Duplikat talabani bloklash (RULE 3)
  ✅ [PASS] Ism, Familiya, Otasining ismi va Telefon bo'yicha duplikat bloklandi

📌 Test 4, 5, 6, 7: Xona sig'imi 3 ta va 4-talabani bloklash (RULE 2)
  ✅ [PASS] 2-talaba xonaga biriktirildi (2/3)
  ✅ [PASS] 3-talaba xonaga biriktirildi (3/3 to'ldi)
  ✅ [PASS] 4-talaba xonaga qo'shilmadi: ❌ Bu xona to‘liq band xatosi qaytdi

📌 Test 8: Davomat 6 xonali tasodifiy kod va 30s taymer (RULE 3, 4)
  ✅ [PASS] 6 xonali raqamli kod yaratildi
  ✅ [PASS] 30 soniyalik faol davomat ochildi

📌 Test 9: Noto'g'ri kod kiritilganda rad etish
  ✅ [PASS] Noto'g'ri kod rad etildi

📌 Test 10: Ro'yxatdan o'tmagan Telegram foydalanuvchini rad etish
  ✅ [PASS] Ro'yxatdan o'tmagan user rad etildi

📌 Test 11: To'g'ri kod bilan davomatdan muvaffaqiyatli o'tish
  ✅ [PASS] Talaba davomatdan muvaffaqiyatli o'tdi

📌 Test 12: Bir davomatda qayta qatnashishni bloklash (RULE 5)
  ✅ [PASS] Takroriy davomat muvaffaqiyatli bloklandi

📌 Test 13, 14: Kelganlar va Kelmaganlar sonini hisoblash
  ✅ [PASS] Jami talabalar soni hisoblandi
  ✅ [PASS] Kelganlar soni: 1
  ✅ [PASS] Kelmaganlar soni to'g'ri hisoblandi (Jami - Kelgan)
  ✅ [PASS] Kelgan talaba ismi to'g'ri
  ✅ [PASS] Kelmaganlar ro'yxati to'g'ri

📌 Test 15: Davomatni muddatidan oldin qo'lda yopish
  ✅ [PASS] Davomat holati EXPIRED ga o'zgardi

📌 Test 16: Vaqti tugagan kodni kiritish rad etilishi
  ✅ [PASS] Tugagan davomat kodi rad etildi

📌 Test 17: Hisobotlar generatsiyasi (PDF & Excel, roomNumber ASC)
  ✅ [PASS] PDF hisobot generatsiya qilindi
  ✅ [PASS] Excel hisobot generatsiya qilindi

====================================================
🎉 BARCHA 21/21 TA INTEGRATION TEST MUVAFFAQIYATLI O'TDI!
====================================================
```

---

## 15. ZAXIRA NUSXALASH (DATABASE BACKUP) & TROUBLESHOOTING

### PostgreSQL Backup olish:
```bash
pg_dump -U postgres -d yotoqxona_db -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"
```

### PostgreSQL Backup tiklash:
```bash
pg_restore -U postgres -d yotoqxona_db -v "backup_file.dump"
```

### Troubleshooting:
- **Port 5000 band bo'lsa:** `.env` faylida `PORT=5001` qilib o'zgartiring.
- **Telegram Bot xabar bermasa:** `.env` ichidagi `BOT_TOKEN` to'g'riligini va internet aloqasini tekshiring.
- **Google Sheets xatolik bersa:** Service Account yoki OAuth kalitlari `.env` ichida kiritilganligiga ishonch hosil qiling.
