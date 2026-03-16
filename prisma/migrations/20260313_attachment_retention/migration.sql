-- AlterTable
ALTER TABLE "Attachment"
  ADD COLUMN "fileName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "keepForever" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expiresAt" TIMESTAMP(3);
