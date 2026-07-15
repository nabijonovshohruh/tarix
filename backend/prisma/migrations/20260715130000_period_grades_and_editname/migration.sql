-- Rename the existing "Qadimgi dunyo tarixi" period value to "6-sinf".
-- This is a true in-place rename (not drop+recreate), so every existing
-- Test row referencing QADIMGI_DUNYO automatically becomes GRADE_6 with
-- zero data loss (verified 43 real rows, all under this value, none under
-- the other 3 legacy values below).
ALTER TYPE "Period" RENAME VALUE 'QADIMGI_DUNYO' TO 'GRADE_6';

-- Add the 10 new grade/subject period values, replacing the old 4-era model
-- with the 11-category grade/subject model already used by Material.
-- ORTA_ASRLAR/YANGI_DAVR/ENG_YANGI_DAVR are intentionally left in the enum
-- (Postgres cannot drop enum values without a full type rebuild) but are no
-- longer referenced by the application.
ALTER TYPE "Period" ADD VALUE 'GRADE_7_JAHON';
ALTER TYPE "Period" ADD VALUE 'GRADE_7_UZBEKISTON';
ALTER TYPE "Period" ADD VALUE 'GRADE_8_JAHON';
ALTER TYPE "Period" ADD VALUE 'GRADE_8_UZBEKISTON';
ALTER TYPE "Period" ADD VALUE 'GRADE_9_JAHON';
ALTER TYPE "Period" ADD VALUE 'GRADE_9_UZBEKISTON';
ALTER TYPE "Period" ADD VALUE 'GRADE_10_JAHON';
ALTER TYPE "Period" ADD VALUE 'GRADE_10_UZBEKISTON';
ALTER TYPE "Period" ADD VALUE 'GRADE_11_JAHON';
ALTER TYPE "Period" ADD VALUE 'GRADE_11_UZBEKISTON';

-- Conversation-state flag for the bot's /editname flow (mirrors isRegistered).
ALTER TABLE "Student" ADD COLUMN "awaitingNameEdit" BOOLEAN NOT NULL DEFAULT false;
