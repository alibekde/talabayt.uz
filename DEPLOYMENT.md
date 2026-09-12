# 🚀 Yotoqxona Tizimi va Telegram Botni Serverga Hamda Domenga Joylash Qo'llanmasi

Ushbu qo'llanma orqali siz loyihani **Telegram Bot + Backend Server**ga hamda **React Admin Panelni o'z domeningizga** oson joylashingiz mumkin.

---

## 🌟 1-USUL: Eng oson va professional usul (VPS Serverda Docker orqali)

Ushbu usulda ham Backend, ham Baza, ham React Frontend bitta serverda ishlab, to'g'ridan-to'g'ri domeningizga ulanadi.

### 1-qadam. VPS Serverga kirish (Ubuntu/Debian)
Terminal yoki PuTTY orqali serveringizga ulaning:
```bash
ssh root@SERVER_IP_MANZILI
```

### 2-qadam. Docker va Docker-Compose o'rnatish
```bash
apt update && apt upgrade -y
apt install docker.io docker-compose git -y
systemctl enable --now docker
```

### 3-qadam. Loyihani serverga yuklash
```bash
git clone LOYIHA_GITHUB_LINKI yotoqxona
cd yotoqxona
```

### 4-qadam. `.env` faylini to'ldirish
```bash
nano .env
```
Quyidagi qiymatlarni tekshiring:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:mysecretpassword123@postgres:5432/yotoqxona_db?schema=public"
JWT_SECRET="juda_maxfiy_jwt_kalit_2026"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
BOT_TOKEN="8915266738:AAFWHSOnYwmFHwsjCaMs689bMSMN7k-4GkM"
ADMIN_IDS="6556683612"
```

### 5-qadam. Docker orqali bitta buyruq bilan ishga tushirish
```bash
docker-compose up -d --build
```
*Tizim PostgreSQL bazasini, Telegram Botni va React Frontendni avtomatik ishga tushiradi!*

---

## 🌐 2-USUL: React Frontendni Vercel / Netlify orqali Domenga ulash

Agar siz React frontendni Vercel orqali alohida domenga (masalan: `admin.yotoqxona.uz`) ulamoqchi bo'lsangiz:

### 1-qadam. Backend va Botni Serverda ishga tushirish (PM2 orqali)
VPS serverda:
```bash
# Node.js va PM2 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# Loyiha papkasida
npm install
npx prisma db push
npm run prisma:seed

# PM2 orqali orqa fonda doimiy ishga tushirish
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2-qadam. Vercel ga Frontendni yuklash
1. [vercel.com](https://vercel.com) ga kiring.
2. `frontend` papkasini import qiling.
3. `Settings` -> `Domains` bo'limiga o'z domeningizni (masalan: `admin.sizningdomeningiz.uz`) kiriting.
4. DNS sozlamalariga Vercel ko'rsatgan `CNAME` yoki `A` yozuvini qo'shing.

---

## 🔒 Nginx va Bepul SSL (HTTPS) Sozlash (VPS uchun)

Domeningizni VPS serverga yo'naltirganingizdan so'ng:

```bash
apt install nginx certbot python3-certbot-nginx -y
```

`/etc/nginx/sites-available/yotoqxona` faylini yarating:
```nginx
server {
    server_name sizningdomeningiz.uz;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Faollashtirish va SSL olish:
```bash
ln -s /etc/nginx/sites-available/yotoqxona /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Bepul SSL sertifikat olish
certbot --nginx -d sizningdomeningiz.uz
```

---

## 🤖 Telegram Bot Webhook Rejimi (Production uchun)

Production rejimida bot webhook orqali yanada tezkor ishlaydi. `.env` fayliga quyidagini qo'shing:
```env
WEBHOOK_URL="https://sizningdomeningiz.uz"
```
Va serverni qayta ishga tushiring:
```bash
pm2 restart yotoqxona-tizimi
```
