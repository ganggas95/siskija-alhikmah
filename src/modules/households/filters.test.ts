import { describe, expect, it } from "vitest";

import { buildHouseholdWhere } from "./filters";

describe("buildHouseholdWhere", () => {
  it("menerapkan filter pencarian, wilayah, status, disabilitas, dan lansia", () => {
    expect(
      buildHouseholdWhere({
        query: "Ahmad",
        regionId: "region-1",
        status: "inactive",
        disability: "yes",
        elderly: "no",
      }),
    ).toMatchObject({
      deletedAt: null,
      regionId: "region-1",
      isDisabled: true,
      isElderly: false,
      OR: expect.any(Array),
      status: "INACTIVE",
    });
  });

  it("mengabaikan pilihan semua", () => {
    expect(buildHouseholdWhere({ regionId: "all", status: "all" })).toEqual({ deletedAt: null });
  });
});
