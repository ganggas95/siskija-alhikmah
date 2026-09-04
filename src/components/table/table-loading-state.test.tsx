import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  TableLoadingState,
  TableLoadingSubmitButton,
  useTableLoadingState,
} from "./table-loading-state";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/jamaah",
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams("page=1"),
}));

function TriggerButton() {
  const tableLoading = useTableLoadingState();

  return (
    <button
      type="button"
      onClick={() => tableLoading?.startLoading("/jamaah?page=2")}
    >
      Start
    </button>
  );
}

describe("TableLoadingState", () => {
  it("shows overlay when loading starts and clears when loadingKey matches", () => {
    const { rerender } = render(
      <TableLoadingState loadingKey="/jamaah?page=1">
        <TriggerButton />
      </TableLoadingState>,
    );

    expect(
      screen.queryByRole("status", { name: /memuat data terbaru/i }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(
      screen.getByRole("status", { name: /memuat data terbaru/i }),
    ).toBeTruthy();

    rerender(
      <TableLoadingState loadingKey="/jamaah?page=2">
        <TriggerButton />
      </TableLoadingState>,
    );

    expect(
      screen.queryByRole("status", { name: /memuat data terbaru/i }),
    ).toBeNull();
  });

  it("disables submit button and shows pending label while table loading is active", () => {
    render(
      <TableLoadingState loadingKey="/jamaah?page=1">
        <TriggerButton />
        <TableLoadingSubmitButton pendingLabel="Memuat tabel">
          Cari
        </TableLoadingSubmitButton>
      </TableLoadingState>,
    );

    const submitButton = screen.getByRole("button", { name: /cari/i });
    expect(submitButton.hasAttribute("disabled")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(
      screen.getByRole("button", { name: /memuat tabel/i }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
