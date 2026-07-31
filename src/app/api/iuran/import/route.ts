import crypto from "node:crypto";
import { PermissionKey } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rolePermissions } from "@/lib/rbac";
import {
  getContributionImportBatchStatusByIdentity,
  importContributionPayments,
  startContributionImportJob,
  type ContributionImportProgressEvent,
} from "@/modules/contributions/imports/import-contribution-payments";

export const runtime = "nodejs";

function encodeEvent(event: ContributionImportProgressEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  if (!rolePermissions[session.user.role]?.includes(PermissionKey.MANAGE_CONTRIBUTIONS)) {
    return NextResponse.json({ message: "Anda tidak memiliki izin." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const year = Number(formData.get("year"));

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File Excel wajib dipilih." }, { status: 400 });
  }

  if (!Number.isInteger(year) || year < 2000) {
    return NextResponse.json({ message: "Tahun import tidak valid." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const fileHash = crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
  const paymentDate = new Date();
  const formMode = String(formData.get("mode") ?? "").trim().toLowerCase();
  const headerMode = String(request.headers.get("x-import-mode") ?? "").trim().toLowerCase();
  const pollingMode = formMode === "poll" || headerMode === "poll";

  if (pollingMode) {
    const identity = await startContributionImportJob({
      fileName: file.name,
      fileSize: file.size,
      fileHash,
      targetYear: year,
      importedById: session.user.id,
      paymentDate,
      buffer,
    });

    return NextResponse.json({
      message: "Import berjalan di latar belakang.",
      ...identity,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (event: ContributionImportProgressEvent) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      try {
        await importContributionPayments(
          {
            fileName: file.name,
            fileSize: file.size,
            fileHash,
            targetYear: year,
            importedById: session.user.id,
            paymentDate,
            buffer,
          },
          write,
        );

        controller.close();
      } catch (error) {
        write({
          type: "error",
          message: error instanceof Error ? error.message : "Terjadi kesalahan import.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  if (!rolePermissions[session.user.role]?.includes(PermissionKey.MANAGE_CONTRIBUTIONS)) {
    return NextResponse.json({ message: "Anda tidak memiliki izin." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileHash = String(searchParams.get("fileHash") ?? "").trim();
  const year = Number(searchParams.get("year"));

  if (!fileHash) {
    return NextResponse.json({ message: "Hash file wajib diisi." }, { status: 400 });
  }

  if (!Number.isInteger(year) || year < 2000) {
    return NextResponse.json({ message: "Tahun import tidak valid." }, { status: 400 });
  }

  const snapshot = await getContributionImportBatchStatusByIdentity(fileHash, year);
  return NextResponse.json(snapshot);
}
