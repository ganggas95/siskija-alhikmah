import { BillStatus, PermissionKey } from "@prisma/client";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
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

export default async function ContributionBillsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  await requirePermission(PermissionKey.MANAGE_CONTRIBUTIONS);

  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const query = getQueryParam(resolvedSearchParams, "q");
  const regionIdFilter = getQueryParam(resolvedSearchParams, "regionId");
  const tabRegion = getQueryParam(resolvedSearchParams, "tabRegion");
  const statusFilter = getQueryParam(resolvedSearchParams, "status");
  const yearFilter = getQueryParam(resolvedSearchParams, "year");
  const fullscreen = getQueryParam(resolvedSearchParams, "fullscreen");
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
      tabRegion: tabRegion || undefined,
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
        tabs={matrix.tabs}
        activeTab={matrix.activeTab}
        rows={matrix.rowsForActiveTab}
        totalItems={matrix.totalHouseholdsForActiveTab}
        currentSearchParams={resolvedSearchParams}
        year={year}
        page={matrix.safePage}
        pageSize={pageSize}
        isFullscreen={fullscreen === "1"}
        toolbarProps={{
          query,
          year,
          regionId: regionIdFilter,
          tabRegion,
          status: statusFilter,
          regions,
          currentSearchParams: resolvedSearchParams,
          normalAmount: fees.normal.toString(),
          specialAmount: fees.special.toString(),
        }}
      />
    </section>
  );
}
