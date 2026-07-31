import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rbac", () => ({
  rolePermissions: { ADMIN: ["MANAGE_HOUSEHOLDS"], AUDITOR: [] },
}));

import { GET } from "./route";

describe("GET /api/jamaah/import-template", () => {
  it("menolak pengguna tanpa session", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("menghasilkan file template untuk pengguna berizin", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "template-import-jamaah.xlsx",
    );
    const body = await response.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(0);
  });
});
