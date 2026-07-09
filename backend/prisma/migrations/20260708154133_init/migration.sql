-- CreateEnum
CREATE TYPE "Period" AS ENUM ('QADIMGI_DUNYO', 'ORTA_ASRLAR', 'YANGI_DAVR', 'ENG_YANGI_DAVR');

-- CreateEnum
CREATE TYPE "CorrectOption" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "Student" (
    "id" BIGSERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "period" "Period" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" BIGSERIAL NOT NULL,
    "testId" BIGINT NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" "CorrectOption" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" BIGSERIAL NOT NULL,
    "studentId" BIGINT NOT NULL,
    "testId" BIGINT NOT NULL,
    "score" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" BIGSERIAL NOT NULL,
    "studentId" BIGINT NOT NULL,
    "sessionId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" BIGSERIAL NOT NULL,
    "examId" BIGINT NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" "CorrectOption" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" BIGSERIAL NOT NULL,
    "studentId" BIGINT NOT NULL,
    "examId" BIGINT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "status" "ExamStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_telegramId_key" ON "Student"("telegramId");

-- CreateIndex
CREATE INDEX "Question_testId_idx" ON "Question"("testId");

-- CreateIndex
CREATE INDEX "TestResult_studentId_idx" ON "TestResult"("studentId");

-- CreateIndex
CREATE INDEX "TestResult_testId_idx" ON "TestResult"("testId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_sessionId_key" ON "AttendanceRecord"("studentId", "sessionId");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_idx" ON "ExamQuestion"("examId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_idx" ON "ExamResult"("studentId");

-- CreateIndex
CREATE INDEX "ExamResult_examId_idx" ON "ExamResult"("examId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
