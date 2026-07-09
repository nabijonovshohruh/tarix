-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GUEST', 'STUDENT', 'ADMIN');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'GUEST';
ALTER TABLE "Student" ADD COLUMN "groupName" TEXT;

-- Backfill: every row that exists at the moment this migration runs predates
-- the guest/student/admin distinction, so treat all of them as enrolled
-- students in a placeholder group. New signups after this point get the
-- column default (GUEST) instead. Admin accounts self-correct to ADMIN on
-- their next request via the ADMIN_TELEGRAM_IDS bootstrap in telegramAuth.ts.
UPDATE "Student" SET "role" = 'STUDENT', "groupName" = 'Umumiy';
