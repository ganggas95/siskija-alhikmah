import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  importHouseholds: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rbac", () => ({
  rolePermissions: {
    ADMIN: ["MANAGE_HOUSEHOLDS"],
    AUDITOR: [],
  },
}));
vi.mock("@/modules/households/imports/import-households", () => ({
  MAX_HOUSEHOLD_IMPORT_FILE_SIZE: 10 * 1024 * 1024,
  importHouseholds: mocks.importHouseholds,
}));

import { POST } from "./route";

describe("POST /api/jamaah/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.importHouseholds.mockResolvedValue({
      totalRows: 1,
      createdRows: 1,
      duplicateRows: 0,
      invalidRows: 0,
      errors: [],
    });
  });

  it("menolak pengguna tanpa session", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST({ formData: async () => new FormData() } as Request);

    expect(response.status).toBe(401);
  });

  it("menolak role tanpa permission", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "auditor-1", role: "AUDITOR" } });

    const response = await POST({ formData: async () => new FormData() } as Request);

    expect(response.status).toBe(403);
  });

  it("memvalidasi file dan meneruskan region serta buffer ke service", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const file = {
      name: "jamaah.xlsx",
      size: 12,
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      arrayBuffer: async () => new ArrayBuffer(12),
    };
    const formData = {
      get: (key: string) => key === "regionId" ? "region-1" : key === "file" ? file : null,
    } as unknown as FormData;

    const response = await POST({ formData: async () => formData } as Request);

    expect(response.status).toBe(200);
    expect(mocks.importHouseholds).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "jamaah.xlsx",
        regionId: "region-1",
        importedById: "admin-1",
        fileSize: file.size,
      }),
    );
  });

  it("menolak ekstensi file selain xlsx", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const formData = {
      get: (key: string) => key === "regionId"
        ? "region-1"
        : key === "file"
          ? { name: "jamaah.csv", size: 3, type: "text/csv", arrayBuffer: async () => new ArrayBuffer(3) }
          : null,
    } as unknown as FormData;

    const response = await POST({ formData: async () => formData } as Request);

    expect(response.status).toBe(400);
    expect(mocks.importHouseholds).not.toHaveBeenCalled();
  });
});
