import { PermissionKey } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rolePermissions } from "@/lib/rbac";
import { createXlsxWorkbook } from "@/modules/contributions/exports/xlsx";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  if (!rolePermissions[session.user.role]?.includes(PermissionKey.MANAGE_HOUSEHOLDS)) {
    return NextResponse.json({ message: "Anda tidak memiliki izin." }, { status: 403 });
  }

  const workbook = createXlsxWorkbook("Import Jamaah", [["Nama Jamaah", "RT", "RW"]]);

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-jamaah.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
