import { PermissionKey } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rolePermissions } from "@/lib/rbac";
import {
  importHouseholds,
  MAX_HOUSEHOLD_IMPORT_FILE_SIZE,
} from "@/modules/households/imports/import-households";

export const runtime = "nodejs";

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      "size" in value &&
      "type" in value &&
      "arrayBuffer" in value &&
      typeof value.arrayBuffer === "function",
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  if (!rolePermissions[session.user.role]?.includes(PermissionKey.MANAGE_HOUSEHOLDS)) {
    return NextResponse.json({ message: "Anda tidak memiliki izin." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const regionId = String(formData.get("regionId") ?? "").trim();

  if (!isUploadedFile(file)) {
    return NextResponse.json({ message: "File Excel wajib dipilih." }, { status: 400 });
  }

  if (!regionId) {
    return NextResponse.json({ message: "Wilayah wajib dipilih." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx") || !XLSX_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ message: "File harus berformat XLSX." }, { status: 400 });
  }

  if (file.size > MAX_HOUSEHOLD_IMPORT_FILE_SIZE) {
    return NextResponse.json({ message: "Ukuran file maksimal 10 MB." }, { status: 413 });
  }

  try {
    const summary = await importHouseholds({
      fileName: file.name,
      fileSize: file.size,
      regionId,
      importedById: session.user.id,
      buffer: await file.arrayBuffer(),
    });

    return NextResponse.json({ message: "Import data jamaah selesai.", summary });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Import data jamaah gagal." },
      { status: 400 },
    );
  }
}
