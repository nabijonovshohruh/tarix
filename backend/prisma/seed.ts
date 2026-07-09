import { PrismaClient, Period, CorrectOption } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.test.findFirst();
  if (existing) {
    console.log("Seed skipped: tests already exist.");
    return;
  }

  const test = await prisma.test.create({
    data: {
      title: "Qadimgi Misr sivilizatsiyasi",
      period: Period.QADIMGI_DUNYO,
      isPublished: true,
      questions: {
        create: [
          {
            questionText: "Qadimgi Misr qaysi daryo bo'yida joylashgan?",
            optionA: "Nil",
            optionB: "Frot",
            optionC: "Dajla",
            optionD: "Gang",
            correctAnswer: CorrectOption.A,
            order: 1,
          },
          {
            questionText: "Piramidalar asosan nima uchun qurilgan?",
            optionA: "Ombor",
            optionB: "Fir'avnlar maqbarasi",
            optionC: "Ibodatxona",
            optionD: "Saroy",
            correctAnswer: CorrectOption.B,
            order: 2,
          },
          {
            questionText: "Qadimgi Misr yozuvi qanday nomlanadi?",
            optionA: "Klinopis",
            optionB: "Kirill",
            optionC: "Ierogliflar",
            optionD: "Lotin",
            correctAnswer: CorrectOption.C,
            order: 3,
          },
        ],
      },
    },
  });

  console.log(`Seeded sample test: ${test.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
