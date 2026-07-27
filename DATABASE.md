# Database

## ERD Ringkas

```mermaid
erDiagram
  User ||--o{ UserRole : has
  Role ||--o{ UserRole : assigned
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : mapped
  Region ||--o{ Household : groups
  Household ||--o{ ContributionBill : billed
  ContributionBill ||--o{ ContributionPayment : paid
  TransactionCategory ||--o{ IncomeTransaction : classifies
  TransactionCategory ||--o{ ExpenseTransaction : classifies
  IncomeTransaction ||--o{ CashLedger : posts
  ExpenseTransaction ||--o{ CashLedger : posts
  User ||--o{ AuditLog : creates
```

## Constraint Penting

- `Household.code` unik
- `ContributionBill(householdId, year, month)` unik
- `ContributionPayment.receiptNumber` unik
- `IncomeTransaction.transactionNumber` unik
- `ExpenseTransaction.transactionNumber` unik
- `CashLedger(sourceType, sourceId, isActive)` unik

## Aturan Ledger

- ledger aktif dengan arah `DEBIT` menambah saldo
- ledger aktif dengan arah `CREDIT` mengurangi saldo
- pembatalan transaksi menonaktifkan ledger aktif terkait
- laporan dan dashboard membaca ledger aktif

## Index MVP

- `Household(headName)`
- `Household(regionId)`
- `ContributionBill(year, month)`
- `ContributionBill(status)`
- `IncomeTransaction(status, transactionDate)`
- `ExpenseTransaction(status, transactionDate)`
- `AuditLog(entity, entityId)`
