import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://educore:educore_dev@localhost:5432/educore_ai?schema=public'
    }
  }
});

async function main() {
  try {
    const res = await prisma.subject.deleteMany();
    console.log("Deleted subjects:", res.count);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
