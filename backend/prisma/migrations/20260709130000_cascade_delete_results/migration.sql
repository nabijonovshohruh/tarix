-- Deleting a Test/Exam must remove its historical results too (matches how
-- Question/ExamQuestion already cascade from their parent). Previously these
-- were ON DELETE RESTRICT, so deleting any topic/exam that had ever received
-- a submission failed with an unhandled foreign key violation.

-- DropForeignKey
ALTER TABLE "TestResult" DROP CONSTRAINT "TestResult_testId_fkey";
ALTER TABLE "ExamResult" DROP CONSTRAINT "ExamResult_examId_fkey";

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
