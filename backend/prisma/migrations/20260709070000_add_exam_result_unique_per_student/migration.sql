-- DropIndex
DROP INDEX "ExamResult_studentId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_studentId_examId_key" ON "ExamResult"("studentId", "examId");
