-- CreateEnum
CREATE TYPE "ContributionPaymentStatus" AS ENUM ('DRAFT', 'VERIFIED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CONTRIBUTION_PAYMENT_EXCEL',
    "sourceFileName" TEXT NOT NULL,
    "sourceFileSize" INTEGER NOT NULL,
    "sourceFileHash" TEXT NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "createdPayments" INTEGER NOT NULL DEFAULT 0,
    "skippedPayments" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "spilledPayments" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "errors" JSONB,
    "importedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ContributionPayment"
ADD COLUMN     "status" "ContributionPaymentStatus" NOT NULL DEFAULT 'VERIFIED',
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "importSourceKey" TEXT,
ADD COLUMN     "importSourceYear" INTEGER,
ADD COLUMN     "importSourceMonth" INTEGER,
ADD COLUMN     "importSourceRow" INTEGER,
ADD COLUMN     "importSourceColumn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_sourceFileHash_targetYear_key" ON "ImportBatch"("sourceFileHash", "targetYear");

-- CreateIndex
CREATE INDEX "ImportBatch_targetYear_idx" ON "ImportBatch"("targetYear");

-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");

-- CreateIndex
CREATE INDEX "ImportBatch_createdAt_idx" ON "ImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "ContributionPayment_status_idx" ON "ContributionPayment"("status");

-- CreateIndex
CREATE INDEX "ContributionPayment_importBatchId_idx" ON "ContributionPayment"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionPayment_importSourceKey_key" ON "ContributionPayment"("importSourceKey");

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionPayment" ADD CONSTRAINT "ContributionPayment_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
