# 1. Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Paketlar va Prisma
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# Frontendni o'rnatish va build qilish
COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend install

COPY . .
RUN npm --prefix frontend run build

# 2. Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production
RUN npx prisma generate

COPY --from=builder /app/src ./src
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
