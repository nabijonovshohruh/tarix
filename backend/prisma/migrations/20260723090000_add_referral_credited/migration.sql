ALTER TABLE "Student" ADD COLUMN "referralCredited" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: under the pre-fix code, referredById was only ever set inside the
-- same code path that unconditionally incremented the referrer's
-- referralCount right away — so every existing referral has already been
-- counted. Mark them credited to prevent the new gated logic from ever
-- re-crediting them.
UPDATE "Student" SET "referralCredited" = true WHERE "referredById" IS NOT NULL;
