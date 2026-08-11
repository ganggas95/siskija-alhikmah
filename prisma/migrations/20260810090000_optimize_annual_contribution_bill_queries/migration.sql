CREATE INDEX "ContributionBill_householdId_year_idx" ON "ContributionBill"("householdId", "year");

CREATE INDEX "ContributionBill_year_status_idx" ON "ContributionBill"("year", "status");

CREATE INDEX "ContributionPayment_billId_status_canceledAt_idx" ON "ContributionPayment"("billId", "status", "canceledAt");
