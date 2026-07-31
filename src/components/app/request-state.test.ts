import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncRequest } from "./request-state";

describe("useAsyncRequest", () => {
  it("keeps loading active until a request succeeds", async () => {
    const { result } = renderHook(() => useAsyncRequest<string>());
    let resolveRequest!: (value: string) => void;
    const request = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    let execution!: Promise<string>;
    act(() => {
      execution = result.current.execute(request);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveRequest("selesai");
      await expect(execution).resolves.toBe("selesai");
    });

    expect(result.current.isLoading).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("clears loading and exposes a safe error after failure", async () => {
    const { result } = renderHook(() => useAsyncRequest<string>());
    let execution!: Promise<string>;
    act(() => {
      execution = result.current.execute(async () => {
        throw new Error("Gagal memuat data");
      });
    });

    await act(async () => {
      await expect(execution).rejects.toThrow("Gagal memuat data");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error?.message).toBe("Gagal memuat data");
  });

  it("prevents a second request while the first request is active", async () => {
    const { result } = renderHook(() => useAsyncRequest<string>());
    let resolveRequest!: (value: string) => void;
    let firstExecution!: Promise<string>;
    act(() => {
      firstExecution = result.current.execute(
        () =>
          new Promise<string>((resolve) => {
            resolveRequest = resolve;
          }),
      );
    });

    await act(async () => {
      await expect(result.current.execute(async () => "kedua")).rejects.toThrow(
        "Request sedang diproses.",
      );
    });

    await act(async () => {
      resolveRequest("pertama");
      await firstExecution;
    });
  });
});
