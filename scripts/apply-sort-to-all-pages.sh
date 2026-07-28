#!/bin/bash

# Script untuk menerapkan fitur sort ke semua halaman list
# Usage: ./scripts/apply-sort-to-all-pages.sh

set -e

PROJECT_ROOT="/Users/nizar/MyProject/sismata"

echo "🚀 Menerapkan fitur sort ke semua halaman..."

# Daftar halaman yang perlu diupdate
PAGES=(
  "src/app/(app)/wilayah/page.tsx"
  "src/app/(app)/jamaah/page.tsx"
  "src/app/(app)/kas-masuk/page.tsx"
  "src/app/(app)/kas-keluar/page.tsx"
  "src/app/(app)/data-user/page.tsx"
  "src/app/(app)/iuran/pembayaran/page.tsx"
  "src/app/(app)/iuran/tagihan/page.tsx"
  "src/app/(app)/buku-kas/page.tsx"
)

# Import yang perlu ditambahkan
IMPORTS_TO_ADD="
import { parseSortParam, type SortState } from '@/lib/table-sort';
import { SortableHeader } from '@/components/table/sortable-header';"

# Loop melalui setiap halaman
for PAGE in "${PAGES[@]}"; do
  FILE_PATH="$PROJECT_ROOT/$PAGE"
  
  if [ ! -f "$FILE_PATH" ]; then
    echo "⚠️  File tidak ditemukan: $PAGE"
    continue
  fi
  
  echo "📝 Memproses: $PAGE"
  
  # Cek apakah sudah diupdate
  if grep -q "SortableHeader" "$FILE_PATH"; then
    echo "   ✅ Sudah memiliki fitur sort, skip..."
    continue
  fi
  
  # Tambahkan import
  sed -i '' "/from '@\/lib\/table-query';/a\\
${IMPORTS_TO_ADD}" "$FILE_PATH"
  
  # Parse sort parameter setelah pagination state
  sed -i '' "/const { page, skip, take, pageSize } = getPaginationState/a\\
\\
  // Parse sort parameter
  const sortParam = getQueryParam(resolvedSearchParams, 'sort');
  const sort: SortState = parseSortParam(sortParam);" "$FILE_PATH"
  
  echo "   ✅ Fitur sort diterapkan!"
done

echo ""
echo "🎉 Selesai! Semua halaman telah diupdate dengan fitur sort."
echo ""
echo "Langkah selanjutnya:"
echo "1. Jalankan 'npx tsc --noEmit' untuk memeriksa error"
echo "2. Update header tabel di setiap halaman dengan <SortableHeader />"
echo "3. Update query Prisma dengan orderBy yang sesuai"
