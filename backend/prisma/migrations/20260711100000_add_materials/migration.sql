-- CreateEnum
CREATE TYPE "MaterialSection" AS ENUM ('DARSLIKLAR', 'MUHIM_QOLLANMALAR', 'UMUMIY_SERTIFIKAT', 'MAVZULASHGAN_SERTIFIKAT');

-- CreateTable
CREATE TABLE "Material" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "section" "MaterialSection" NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_section_idx" ON "Material"("section");
