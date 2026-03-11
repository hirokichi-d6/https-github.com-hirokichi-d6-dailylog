-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Weather" AS ENUM ('SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'OTHER');

-- CreateEnum
CREATE TYPE "WindStrength" AS ENUM ('CALM', 'LIGHT', 'MODERATE', 'STRONG', 'VERY_STRONG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" "Weather",
    "temperature" DECIMAL(4,1),
    "windStrength" "WindStrength",
    "diaryContent" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRecord" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "totalSales" DECIMAL(12,2),
    "customerCount" INTEGER,
    "targetSales" DECIMAL(12,2),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCategory" (
    "id" TEXT NOT NULL,
    "salesRecordId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SalesCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDatetime" TIMESTAMP(3) NOT NULL,
    "endDatetime" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "reminderMinutes" INTEGER[],
    "category" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "entryId" TEXT,
    "memoId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_userId_date_key" ON "DailyEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRecord_entryId_key" ON "SalesRecord"("entryId");

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DailyEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCategory" ADD CONSTRAINT "SalesCategory_salesRecordId_fkey" FOREIGN KEY ("salesRecordId") REFERENCES "SalesRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DailyEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DailyEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE SET NULL ON UPDATE CASCADE;