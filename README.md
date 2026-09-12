# 🏠 Yotoqxona Talabalari Telegram Bot + Admin Panel Tizimi

Ushbu tizim yotoqxonada yashaydigan talabalarni ro‘yxatga olish, tezkor qidirish, xonalar bo'yicha boshqarish hamda tartibli hisobotlarni (**PDF**, **Excel**, **Google Sheets**) shakllantirish uchun mo‘ljallangan professional Full-Stack tizimdir.

---

## 🌟 Asosiy Xususiyatlar

1. **Nol Demo Ma'lumot (Zero Fake Data)**:
   - Dastlabki holatda bazada **0 ta talaba** bo'ladi.
   - Dashboardda: *Jami talabalar: 0*.
   - Jadvalda: *Hozircha talabalar mavjud emas.*
2. **Faqat Kerakli 6 ta Talaba Maydoni**:
   - `Ismi`
   - `Familiyasi`
   - `Otasining ismi`
   - `Yo‘nalishi`
   - `Telefon raqami` (+998901234567)
   - `Xona raqami` (101, 102, 205...)
3. **Tezkor Telegram Bot (FSM & Wizard)**:
   - 6 bosqichli forma (`[⬅️ Orqaga]` va `[❌ Bekor qilish]` tugmalari bilan).
   - Telegram `[📱 Telefon raqamimni yuborish]` tugmasi yoki matn formatida qabul qilish.
   - Duplikat tekshiruvi (bir xil talaba qayta kiritilishining oldi olinadi).
   - Admin xavfsizligi (`ADMIN_IDS` bo'yicha cheklov).
   - **PDF va Excel hisobotlarini to'g'ridan-to'g'ri Telegram chatga fayl ko'rinishida yuborish.**
4. **Xona Raqami Bo'yicha Qat'iy O'sish Tartibi**:
   - Hisobotlar: `101-XONA` $\rightarrow$ `102-XONA` $\rightarrow$ `201-XONA` ... tartibida.
   - Xona ichida talabalar `1, 2, 3...` tartibida.
5. **Uch Turdagi Professional Eksport**:
   - **📄 PDF**: A4 format, zamonaviy sarlavhalar, guruhlangan xonalar, avto-paging.
   - **📊 Excel (.xlsx)**: Stillangan sarlavha, muzlatilgan 1-qator (freeze), avtomatik ustun kengligi.
   - **📑 Google Sheets**: Google Sheets API orqali batch-update, filtr va formatlash.
6. **Minimal va Tezkor Admin Panel (React + Tailwind CSS)**:
   - Dashboard (real-vaqt statistikasi).
   - Instant Debounced Search (Ism, familiya, ota ismi, yo'nalish, telefon, xona).
   - Server-side Pagination.
   - Xona filtri, Tahrirlash va O'chirish modallari.
   - JWT autentifikatsiya va bcrypt parol himoyasi.

---

## 📋 Texnologiyalar

- **Backend**: Node.js, Express, Telegraf (Telegram Bot Framework)
- **Database**: PostgreSQL, Prisma ORM
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Axios
- **Hujjat yaratish**: PDFKit, ExcelJS, Google APIs (googleapis)
- **Xavfsizlik**: Helmet, Express Rate Limit, bcryptjs, JSON Web Token (JWT), Zod

---

## 🚀 O‘rnatish va Ishga Tushirish

### 1. Talablar
- **Node.js** (v18 yoki undan yuqori)
- **PostgreSQL** (v14 yoki undan yuqori)
- **npm** yoki **yarn**

---

### 2. PostgreSQL Sozlash va Database Yaratish

PostgreSQL terminalida yoki pgAdmin orqali yangi baza yarating:
```sql
CREATE DATABASE yotoqxona_db;
```

---

### 3. Loyiha Fayllarini Sozlash (`.env`)

Loyihaning asosiy papkasidagi `.env` faylini oching (yoki `.env.example` dan nusxa oling):
```env
# SERVER KONFIGURATSIYASI
PORT=5000
NODE_ENV=development

# DATABASE
DATABASE_URL="postgresql://postgres:PAROL@localhost:5432/yotoqxona_db?schema=public"

# AUTHENTICATION
JWT_SECRET="sizning_juda_maxfiy_jwt_kalitingiz_2026"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# TELEGRAM BOT
BOT_TOKEN="123456789:ABCDefGhIJklMnOpQrStUvWxYz"
ADMIN_IDS="123456789,987654321"
WEBHOOK_URL=""

# GOOGLE SHEETS API (Ixtiyoriy)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://developers.google.com/oauthplayground"
GOOGLE_REFRESH_TOKEN=""
GOOGLE_SPREADSHEET_ID=""
```

---

### 4. Telegram Bot Yaratish va Sozlash

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/newbot` buyrug'ini yuboring va bot nomi hamda username'ini belgilang.
3. BotFather bergan **HTTP API Token**ni `.env` faylidagi `BOT_TOKEN` qismiga qo'ying.
4. O'zingizning Telegram ID'ingizni [@userinfobot](https://t.me/userinfobot) orqali bilib oling va uni `ADMIN_IDS` ga yozing (masalan: `ADMIN_IDS="512345678"`).

---

### 5. Google Sheets API Sozlash (Ixtiyoriy)

Agar Google Sheets ga to'g'ridan-to'g'ri eksport qilmoqchi bo'lsangiz:
1. [Google Cloud Console](https://console.cloud.google.com/) ga kiring va yangi loyiha yarating.
2. **Google Sheets API** va **Google Drive API** ni yoqing (Enable APIs).
3. **Credentials** bo'limidan OAuth 2.0 Client ID yoki **Service Account** yarating.
4. Olingan kalitlarni `.env` fayliga joylashtiring.

---

### 6. Bog'liqliklarni O'rnatish va Bazani Tayyorlash

```bash
# 1. Asosiy backend paketlarini o'rnatish
npm install

# 2. Frontend paketlarini o'rnatish
cd frontend
npm install
cd ..

# 3. Prisma schema bo'yicha bazada jadvallarni yaratish
npx prisma db push

# 4. Admin hisobini yaratish (Zero demo data kafolatlangan)
npm run prisma:seed
```

---

### 7. Ishga Tushirish (Development Rejimida)

**1-usul: Backend va Botni ishga tushirish:**
```bash
npm run dev
```
*(Server http://localhost:5000 manzilida ishlaydi, Telegram bot esa polling rejimida faollashadi)*

**2-usul: Frontend Admin Panelni alohida ishlab chiqish rejimida ishga tushirish:**
```bash
cd frontend
npm run dev
```
*(Frontend http://localhost:3000 manzilida ochiladi va so'rovlarni avtomatik 5000-portga yo'naltiradi)*

---

### 8. Ishga Tushirish (Production Rejimida)

```bash
# 1. Frontendni build qilish
npm run build

# 2. Production serverni ishga tushirish
NODE_ENV=production npm start
```
Frontend avtomatik ravishda `http://localhost:5000` manzilida backend bilan birgalikda xizmat ko'rsatadi.

---

## 🧪 Sinov (Test Qilish Ketma-Ketligi)

| № | Test nomi | Qilinadigan amal | Kutilgan natija |
|---|-----------|------------------|-----------------|
| 1 | **0 Student Holati** | Dastlab Dashboard va Hisobotni ochish | Talabalar soni: 0, "Hozircha talabalar mavjud emas" chiqishi |
| 2 | **Talaba qo'shish** | Bot orqali `[➕ Talaba qo‘shish]` yoki Paneldan qo'shish | 6 ta maydon to'ldirilib, muvaffaqiyatli saqlanadi |
| 3 | **Telefon tekshiruvi** | `12345` kabi noto'g'ri raqam kiritish | `❌ Telefon raqami noto‘g‘ri` xatosi |
| 4 | **Xona tekshiruvi** | `abc` kabi matn kiritish | `❌ Xona raqami noto‘g‘ri` xatosi |
| 5 | **Duplikat tekshiruvi** | Mavjud talabani yana kiritish | `⚠️ Ushbu talaba tizimda allaqachon mavjud` ogohlantirishi |
| 6 | **Qidiruv** | Ism, telefon yoki xona raqamini yozish | Bir lahzada kerakli talabalar chiqadi |
| 7 | **Xona bo'yicha tartib** | 205, 101, 102 xonalariga talaba qo'shish | Hisobotda `101 -> 102 -> 205` tartibida chiqadi |
| 8 | **PDF yuklab olish** | `[📄 PDF yuklab olish]` tugmasini bosish | Xonalar bo'yicha chiroyli A4 PDF fayl yuklanadi |
| 9 | **Excel yuklab olish** | `[📊 Excel yuklab olish]` tugmasini bosish | Ustunlari stillangan `.xlsx` fayl yuklanadi |
| 10 | **Ruxsatsiz foydalanuvchi** | Begona Telegram hisobidan botga yozish | `❌ Sizda ushbu botdan foydalanish huquqi mavjud emas` |

---

## 🔒 Xavfsizlik Qoidalari

- Parollar bazada `bcrypt` orqali heshlangan holda saqlanadi.
- API so'rovlari JWT token orqali tekshiriladi.
- Bot faqat `ADMIN_IDS` dagi foydalanuvchilar buyruqlariga javob beradi.
- Loglarda telefon raqamlari, parollar va maxfiy tokenlar yashiriladi (masking).
