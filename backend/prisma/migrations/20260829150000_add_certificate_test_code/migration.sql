-- AlterTable
ALTER TABLE "CertificateTest" ADD COLUMN "testCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTest_testCode_key" ON "CertificateTest"("testCode");
