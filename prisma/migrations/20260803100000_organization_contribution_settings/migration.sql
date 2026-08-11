ALTER TABLE "MosqueProfile"
ADD COLUMN "organizationName" TEXT,
ADD COLUMN "specialContributionFee" DECIMAL(18,2) NOT NULL DEFAULT 0;

UPDATE "MosqueProfile"
SET "specialContributionFee" = "defaultContributionFee"
WHERE "specialContributionFee" = 0;
