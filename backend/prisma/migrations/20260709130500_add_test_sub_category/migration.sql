-- CreateEnum
CREATE TYPE "SubCategory" AS ENUM ('UZBEKISTON', 'JAHON');

-- AlterTable
-- Nullable: only ORTA_ASRLAR/YANGI_DAVR/ENG_YANGI_DAVR topics require one
-- (enforced at the app layer); QADIMGI_DUNYO topics stay null.
ALTER TABLE "Test" ADD COLUMN "subCategory" "SubCategory";
