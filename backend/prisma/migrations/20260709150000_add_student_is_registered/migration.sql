ALTER TABLE "Student" ADD COLUMN "isRegistered" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather every account that existed before this feature shipped — only
-- brand-new Student rows created from now on start out unregistered.
UPDATE "Student" SET "isRegistered" = true;
