-- CreateEnum
CREATE TYPE "MaterialSubSection" AS ENUM ('GRADE_6', 'GRADE_7_JAHON', 'GRADE_7_UZBEKISTON', 'GRADE_8_JAHON', 'GRADE_8_UZBEKISTON', 'GRADE_9_JAHON', 'GRADE_9_UZBEKISTON', 'GRADE_10_JAHON', 'GRADE_10_UZBEKISTON', 'GRADE_11_JAHON', 'GRADE_11_UZBEKISTON');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN "subSection" "MaterialSubSection";

-- CreateIndex
CREATE INDEX "Material_subSection_idx" ON "Material"("subSection");
