-- CreateEnum
CREATE TYPE "MatchAnswerOption" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');

-- AlterTable
ALTER TABLE "CertificateQuestion" DROP COLUMN "matchItems",
ADD COLUMN     "matchAnswer" "MatchAnswerOption";

-- AlterTable
ALTER TABLE "CertificateAnswer" DROP COLUMN "matchItems",
DROP COLUMN "selectedMatches",
ADD COLUMN     "matchAnswer" "MatchAnswerOption",
ADD COLUMN     "selectedMatchAnswer" "MatchAnswerOption";
