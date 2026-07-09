-- AlterTable
ALTER TABLE "ExamQuestion" ADD COLUMN     "explanation" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "explanation" TEXT;

-- CreateTable
CREATE TABLE "TestAnswer" (
    "id" BIGSERIAL NOT NULL,
    "resultId" BIGINT NOT NULL,
    "questionId" BIGINT,
    "order" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" "CorrectOption" NOT NULL,
    "explanation" TEXT,
    "selectedOption" "CorrectOption",
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "TestAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnswer" (
    "id" BIGSERIAL NOT NULL,
    "resultId" BIGINT NOT NULL,
    "questionId" BIGINT,
    "order" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" "CorrectOption" NOT NULL,
    "explanation" TEXT,
    "selectedOption" "CorrectOption",
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestAnswer_resultId_idx" ON "TestAnswer"("resultId");

-- CreateIndex
CREATE INDEX "ExamAnswer_resultId_idx" ON "ExamAnswer"("resultId");

-- AddForeignKey
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "TestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ExamResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
