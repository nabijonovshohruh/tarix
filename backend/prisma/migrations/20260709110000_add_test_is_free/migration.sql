-- AlterTable
ALTER TABLE "Test" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- Mark the single earliest-created topic as the free preview; every other
-- existing (and all future) topic stays paid by the column default.
UPDATE "Test" SET "isFree" = true
WHERE id = (SELECT id FROM "Test" ORDER BY "createdAt" ASC, id ASC LIMIT 1);
