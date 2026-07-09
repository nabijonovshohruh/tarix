import ExcelJS from "exceljs";
import path from "node:path";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Savollar");

  sheet.columns = [
    { header: "Savol", key: "questionText", width: 40 },
    { header: "A", key: "optionA", width: 20 },
    { header: "B", key: "optionB", width: 20 },
    { header: "C", key: "optionC", width: 20 },
    { header: "D", key: "optionD", width: 20 },
    { header: "To'g'ri javob", key: "correctAnswer", width: 14 },
    { header: "Izoh", key: "explanation", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  sheet.addRow({
    questionText: "Qadimgi Misr qaysi daryo bo'yida joylashgan?",
    optionA: "Nil",
    optionB: "Frot",
    optionC: "Dajla",
    optionD: "Gang",
    correctAnswer: "A",
    explanation: "Qadimgi Misr sivilizatsiyasi Nil daryosi bo'yida rivojlangan.",
  });

  const outPath = path.join(__dirname, "..", "..", "frontend", "public", "savollar-shabloni.xlsx");
  await workbook.xlsx.writeFile(outPath);
  console.log(`Template written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
