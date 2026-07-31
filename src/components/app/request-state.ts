"use client";

import { useCallback, useRef, useState } from "react";

export function useAsyncRequest<T>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeRequest = useRef(false);

  const execute = useCallback(async (request: () => Promise<T>) => {
    if (activeRequest.current) {
      throw new Error("Request sedang diproses.");
    }

    activeRequest.current = true;
    setIsLoading(true);
    setError(null);

    try {
      return await request();
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error("Request gagal diproses.");
      setError(normalizedError);
      throw normalizedError;
    } finally {
      activeRequest.current = false;
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { execute, isLoading, error, reset };
}
