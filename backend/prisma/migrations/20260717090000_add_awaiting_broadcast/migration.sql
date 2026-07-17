-- Conversation-state flag for the bot's /sendall broadcast flow (mirrors
-- awaitingNameEdit's pattern).
ALTER TABLE "Student" ADD COLUMN "awaitingBroadcast" BOOLEAN NOT NULL DEFAULT false;
