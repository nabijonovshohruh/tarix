-- AlterTable
ALTER TABLE "CertificateResult" ADD COLUMN     "certificateNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CertificateResult_certificateNumber_key" ON "CertificateResult"("certificateNumber");
