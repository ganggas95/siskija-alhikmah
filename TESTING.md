# Testing

## Unit Test

Fokus MVP:

- format dan penjumlahan uang
- penentuan status tagihan
- helper nomor transaksi

## Integration Test

Fokus MVP:

- pembayaran iuran menghasilkan income transaction
- verifikasi pengeluaran membuat ledger kredit
- ledger menghasilkan saldo yang benar

## E2E Test

Skenario MVP:

1. login sebagai bendahara
2. buka dashboard
3. generate tagihan
4. input pembayaran
5. lihat perubahan buku kas

## Quality Gate

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e
```
