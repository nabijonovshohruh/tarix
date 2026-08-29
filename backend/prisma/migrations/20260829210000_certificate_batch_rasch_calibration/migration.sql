-- AlterTable
ALTER TABLE "CertificateTest" ADD COLUMN     "resultsReleasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CertificateResult" ALTER COLUMN "logit" DROP NOT NULL,
ALTER COLUMN "scaledScore" DROP NOT NULL,
ALTER COLUMN "grade" DROP NOT NULL;
