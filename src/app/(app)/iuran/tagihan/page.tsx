import { BillStatus, PermissionKey } from "@prisma/client";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { TablePagination } from "@/components/table/table-pagination";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import {
  getPaginationState,
  getQueryParam,
  resolveSearchParams,
  type SearchParamsInput,
} from "@/lib/table-query";
import { getContributionFeeConfig } from "@/modules/contributions/services/contribution-settings";
import { getAnnualBillsMatrix } from "@/modules/contributions/queries/get-annual-bills-matrix";
import { AnnualBillsMatrix } from "./_components/annual-bills-matrix";
import { AnnualBillsSummary } from "./_components/annual-bills-summary";
import { AnnualBillsToolbar } from "./_components/annual-bills-toolbar";

export default async function ContributionBillsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const regionIdFilter = getQueryParam(resolvedSearchParams, "regionId");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const yearFilter = getQueryParam(resolvedSearchParams, "year");
  const { page, pageSize } = getPaginationState(resolvedSearchParams, 20);
  const now = new Date();
  const year = Number(yearFilter) >= 2000 ? Number(yearFilter) : now.getFullYear();

  const [regions, fees, matrix] = await Promise.all([
    db.region.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getContributionFeeConfig(),
    getAnnualBillsMatrix({
      year,
      query: query || undefined,
      regionId: regionIdFilter || undefined,
      status:
        statusFilter && statusFilter !== "all"
          ? (statusFilter as BillStatus)
          : "all",
      page,
      take: pageSize,
    }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tagihan Iuran Tahunan"
        description="Pantau status Januari–Desember per keluarga dan generate tagihan setahun penuh dari satu halaman."
        icon={ScrollText}
      />

      <AnnualBillsSummary summary={matrix.summary} />

      <AnnualBillsMatrix
        rows={matrix.rows}
        currentSearchParams={resolvedSearchParams}
        year={year}
        toolbar={
          <AnnualBillsToolbar
            query={query}
            year={year}
            regionId={regionIdFilter}
            status={statusFilter}
            regions={regions}
            currentSearchParams={resolvedSearchParams}
            normalAmount={fees.normal.toString()}
            specialAmount={fees.special.toString()}
          />
        }
      />

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <TablePagination
          pathname="/iuran/tagihan"
          searchParams={resolvedSearchParams}
          totalItems={matrix.totalHouseholds}
          page={page}
          pageSize={pageSize}
          itemLabel="keluarga"
        />
      </div>
    </section>
  );
}
