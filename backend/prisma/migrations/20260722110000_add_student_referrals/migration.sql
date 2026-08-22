-- Referral contest ("Konkurs"): who invited this student, and how many
-- brand-new users this student has themselves successfully referred.
ALTER TABLE "Student" ADD COLUMN "referredById" BIGINT;
ALTER TABLE "Student" ADD COLUMN "referralCount" INTEGER NOT NULL DEFAULT 0;

-- SetNull: deleting a referrer must never cascade-delete the people they
-- referred — they just lose that historical "who invited me" link.
ALTER TABLE "Student" ADD CONSTRAINT "Student_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "Student"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Student_referredById_idx" ON "Student"("referredById");
