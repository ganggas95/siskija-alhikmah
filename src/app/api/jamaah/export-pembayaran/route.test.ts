import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  audit: vi.fn(),
  rows: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/audit", () => ({ createAuditLog: mocks.audit }));
vi.mock("@/lib/rbac", () => ({
  rolePermissions: {
    ADMIN: ["MANAGE_HOUSEHOLDS"],
    AUDITOR: [],
  },
}));
vi.mock("@/modules/contributions/exports/export-contribution-payments", () => ({
  getContributionPaymentExportRows: mocks.rows,
}));

import { GET } from "./route";

describe("GET /api/jamaah/export-pembayaran", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.audit.mockResolvedValue(undefined);
    mocks.rows.mockResolvedValue([]);
  });

  it("menolak request tanpa session", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/jamaah/export-pembayaran?year=2026"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ message: "Sesi tidak ditemukan." });
  });

  it("menolak role yang tidak memiliki permission", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "auditor-1", role: "AUDITOR" } });

    const response = await GET(new Request("http://localhost/api/jamaah/export-pembayaran?year=2026"));

    expect(response.status).toBe(403);
    expect(mocks.rows).not.toHaveBeenCalled();
  });

  it("menghasilkan file dan mencatat audit untuk request berizin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.rows.mockResolvedValue([
      { code: "JMH-00001", name: "Ahmad", monthlyAmounts: [10000, ...Array<number | null>(11).fill(null)] },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/jamaah/export-pembayaran?year=2026&regionId=region-1&status=active",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /export-pembayaran-jamaah-\d+\.xlsx/,
    );
    expect(mocks.rows).toHaveBeenCalledWith({
      year: 2026,
      regionId: "region-1",
      status: "active",
      query: undefined,
      disability: undefined,
      elderly: undefined,
    });
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXPORT_CONTRIBUTION_PAYMENT_EXCEL",
        userId: "admin-1",
      }),
    );
  });

  it("menolak export jika tahun tidak dikirim", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });

    const response = await GET(
      new Request("http://localhost/api/jamaah/export-pembayaran"),
    );

    expect(response.status).toBe(400);
    expect(mocks.rows).not.toHaveBeenCalled();
  });
});
