const { PrismaClient } = require('./node_modules/@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.create({
      data: {
        email: `cli-test+${Math.floor(Math.random() * 100000)}@example.com`,
        name: 'cli',
        passwordHash: 'hash'
      }
    });
    console.log('Created user:', u);
  } catch (e) {
    console.error('Prisma error:');
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();