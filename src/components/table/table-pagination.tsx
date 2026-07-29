import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  buildQueryString,
  getTotalPages,
  type QueryValue,
} from "@/lib/table-query";

type TablePaginationProps = {
  pathname: string;
  searchParams: Record<string, QueryValue>;
  totalItems: number;
  page: number;
  pageSize: number;
  itemLabel?: string;
};

export function TablePagination({
  pathname,
  searchParams,
  totalItems,
  page,
  pageSize,
  itemLabel = "data",
}: TablePaginationProps) {
  const totalPages = getTotalPages(totalItems, pageSize);
  const safePage = Math.min(page, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Menampilkan {startItem}-{endItem} dari {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink
          pathname={pathname}
          searchParams={searchParams}
          targetPage={safePage - 1}
          disabled={safePage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </PaginationLink>
        <Badge variant="secondary" className="rounded-lg px-3 py-2 font-medium">
          Halaman {safePage} / {totalPages}
        </Badge>
        <PaginationLink
          pathname={pathname}
          searchParams={searchParams}
          targetPage={safePage + 1}
          disabled={safePage >= totalPages}
        >
          <span>Berikutnya</span>
          <ChevronRight className="h-4 w-4" />
        </PaginationLink>
      </div>
    </div>
  );
}

function PaginationLink({
  pathname,
  searchParams,
  targetPage,
  disabled,
  children,
}: {
  pathname: string;
  searchParams: Record<string, QueryValue>;
  targetPage: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button type="button" variant="outline" disabled className="gap-2">
        {children}
      </Button>
    );
  }

  const href = `${pathname}${buildQueryString(searchParams, { page: targetPage })}`;

  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={href}>{children}</Link>
    </Button>
  );
}
