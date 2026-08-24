require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const defaultVip = await prisma.vipLevel.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        levelName: 'VIP 1',
        rakebackPercentage: 0.0,
        levelUpBonus: 0.0
      }
    });
    console.log('Successfully created VIP 1:', defaultVip);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
