import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingButton } from "./loading-button";

describe("LoadingButton", () => {
  it("renders spinner state and disables button while loading", () => {
    render(
      <LoadingButton loading loadingLabel="Menyimpan data">
        Simpan
      </LoadingButton>,
    );

    const button = screen.getByRole("button", { name: /menyimpan data/i });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Menyimpan data")).toBeTruthy();
  });

  it("renders normal content when not loading", () => {
    render(<LoadingButton>Simpan</LoadingButton>);

    const button = screen.getByRole("button", { name: /simpan/i });
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-busy")).toBe("false");
  });
});
