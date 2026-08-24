const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // Admin 1
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@rxfury.com' },
    update: {},
    create: {
      email: 'admin@rxfury.com',
      systematicId: 'FURY-ADMIN-1',
      passwordHash: passwordHash,
      role: 'ADMIN',
      mainWalletBalance: 100000.0,
      bonusWalletBalance: 50000.0,
      vipLevel: 8
    },
  });

  // Admin 2
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@rxfury.com' },
    update: {},
    create: {
      email: 'admin2@rxfury.com',
      systematicId: 'FURY-ADMIN-2',
      passwordHash: passwordHash,
      role: 'ADMIN',
      mainWalletBalance: 100000.0,
      bonusWalletBalance: 50000.0,
      vipLevel: 8
    },
  });

  console.log('Seed completed successfully:');
  console.log({ admin1, admin2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
