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
    const subjects = await prisma.subject.findMany();
    console.log("Subjects in database:", JSON.stringify(subjects, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
