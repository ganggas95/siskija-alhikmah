import { PermissionKey } from "@prisma/client";
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import { rolePermissions } from "@/lib/rbac";
import {
  getContributionPaymentExportRows,
  type ContributionExportInput,
} from "@/modules/contributions/exports/export-contribution-payments";
import {
  buildContributionExportRows,
  createContributionPaymentsWorkbook,
} from "@/modules/contributions/exports/xlsx";

export const runtime = "nodejs";

const exportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(9999),
  q: z.string().trim().optional(),
  regionId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  disability: z.string().trim().optional(),
  elderly: z.string().trim().optional(),
});

function getOptionalParam(value: string | null) {
  const normalized = value?.trim();
  return normalized && normalized !== "all" ? normalized : undefined;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  if (!rolePermissions[session.user.role]?.includes(PermissionKey.MANAGE_HOUSEHOLDS)) {
    return NextResponse.json({ message: "Anda tidak memiliki izin." }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = exportQuerySchema.safeParse({
    year: url.searchParams.get("year"),
    q: getOptionalParam(url.searchParams.get("q")),
    regionId: getOptionalParam(url.searchParams.get("regionId")),
    status: getOptionalParam(url.searchParams.get("status")),
    disability: getOptionalParam(url.searchParams.get("disability")),
    elderly: getOptionalParam(url.searchParams.get("elderly")),
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Parameter export tidak valid." }, { status: 400 });
  }

  const input: ContributionExportInput = {
    year: parsed.data.year,
    query: parsed.data.q,
    regionId: parsed.data.regionId,
    status: parsed.data.status,
    disability: parsed.data.disability,
    elderly: parsed.data.elderly,
  };
  const rows = await getContributionPaymentExportRows(input);
  const workbookRows = buildContributionExportRows(rows);
  const workbook = createContributionPaymentsWorkbook(workbookRows);

  await createAuditLog({
    userId: session.user.id,
    action: "EXPORT_CONTRIBUTION_PAYMENT_EXCEL",
    entity: "ContributionPaymentExport",
    entityId: String(input.year),
    afterData: {
      year: input.year,
      filters: {
        q: input.query ?? null,
        regionId: input.regionId ?? null,
        status: input.status ?? null,
        disability: input.disability ?? null,
        elderly: input.elderly ?? null,
      },
      householdCount: rows.length,
    },
  });

  return new Response(workbook, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export-pembayaran-jamaah-${randomInt(100000, 1000000)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
