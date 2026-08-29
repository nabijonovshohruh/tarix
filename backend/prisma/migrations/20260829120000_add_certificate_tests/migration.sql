-- CreateEnum
CREATE TYPE "CertQuestionType" AS ENUM ('MCQ', 'MATCHING', 'OPEN');

-- CreateEnum
CREATE TYPE "CertGrade" AS ENUM ('NONE', 'C', 'C_PLUS', 'B', 'B_PLUS', 'A', 'A_PLUS');

-- CreateTable
CREATE TABLE "CertificateTest" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateQuestion" (
    "id" BIGSERIAL NOT NULL,
    "testId" BIGINT NOT NULL,
    "type" "CertQuestionType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT,
    "optionB" TEXT,
    "optionC" TEXT,
    "optionD" TEXT,
    "correctOption" "CorrectOption",
    "matchItems" JSONB,
    "openLabelA" TEXT,
    "openAnswerA" TEXT,
    "openLabelB" TEXT,
    "openAnswerB" TEXT,
    "explanation" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "CertificateQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateResult" (
    "id" BIGSERIAL NOT NULL,
    "studentId" BIGINT NOT NULL,
    "testId" BIGINT NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "maxPossible" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "logit" DOUBLE PRECISION NOT NULL,
    "scaledScore" DOUBLE PRECISION NOT NULL,
    "grade" "CertGrade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateAnswer" (
    "id" BIGSERIAL NOT NULL,
    "resultId" BIGINT NOT NULL,
    "questionId" BIGINT,
    "order" INTEGER NOT NULL,
    "type" "CertQuestionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT,
    "optionB" TEXT,
    "optionC" TEXT,
    "optionD" TEXT,
    "correctOption" "CorrectOption",
    "selectedOption" "CorrectOption",
    "matchItems" JSONB,
    "selectedMatches" JSONB,
    "openLabelA" TEXT,
    "openAnswerA" TEXT,
    "studentAnswerA" TEXT,
    "openLabelB" TEXT,
    "openAnswerB" TEXT,
    "studentAnswerB" TEXT,
    "explanation" TEXT,
    "pointsEarned" DOUBLE PRECISION NOT NULL,
    "maxPoints" DOUBLE PRECISION NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "CertificateAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateQuestion_testId_idx" ON "CertificateQuestion"("testId");

-- CreateIndex
CREATE INDEX "CertificateResult_studentId_idx" ON "CertificateResult"("studentId");

-- CreateIndex
CREATE INDEX "CertificateResult_testId_idx" ON "CertificateResult"("testId");

-- CreateIndex
CREATE INDEX "CertificateAnswer_resultId_idx" ON "CertificateAnswer"("resultId");

-- AddForeignKey
ALTER TABLE "CertificateQuestion" ADD CONSTRAINT "CertificateQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "CertificateTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateResult" ADD CONSTRAINT "CertificateResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateResult" ADD CONSTRAINT "CertificateResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "CertificateTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateAnswer" ADD CONSTRAINT "CertificateAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "CertificateResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
