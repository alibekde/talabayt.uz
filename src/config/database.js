const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
} catch (error) {
  logger.error('Prisma initialization error:', error.message);
}

module.exports = prisma;
