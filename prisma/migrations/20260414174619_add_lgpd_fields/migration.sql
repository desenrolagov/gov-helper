-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lgpdAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lgpdAcceptedAt" TIMESTAMP(3);
