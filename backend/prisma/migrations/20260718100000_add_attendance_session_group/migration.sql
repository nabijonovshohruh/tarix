-- Nullable so pre-existing sessions stay valid ("ungated") — new sessions
-- are required to set this at the app layer (attendance.controller.ts).
ALTER TABLE "AttendanceSession" ADD COLUMN "groupName" TEXT;
