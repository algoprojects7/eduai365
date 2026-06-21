const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst({
    where: { slug: 'greenfield' },
  });
  console.log('Greenfield Academy in DB:', JSON.stringify(school, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
