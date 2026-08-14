"use client";

import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LoadingIndicator } from "@/components/app/loading-indicator";
import { Button, type ButtonProps } from "@/components/ui/button";
import { TableLoadingOverlay } from "@/components/table/table-loading-overlay";
import { cn } from "@/lib/utils";

type TableLoadingContextValue = {
  isLoading: boolean;
  startLoading: (targetHref?: string) => void;
};

const TableLoadingContext = createContext<TableLoadingContextValue | null>(null);

function normalizeHref(pathname: string, searchParams: { toString(): string }) {
  const queryString = searchParams.toString();
  return `${pathname}${queryString ? `?${queryString}` : ""}`;
}

function buildTargetHref(actionPath: string, formData: FormData) {
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === "all") continue;

    params.append(key, trimmedValue);
  }

  const queryString = params.toString();
  return `${actionPath}${queryString ? `?${queryString}` : ""}`;
}

export function TableLoadingState({
  children,
  loadingKey,
  className,
  overlayLabel,
}: {
  children: ReactNode;
  loadingKey?: string;
  className?: string;
  overlayLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKey = loadingKey ?? normalizeHref(pathname, searchParams);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (pendingKey && pendingKey === currentKey) {
      setIsLoading(false);
      setPendingKey(null);
    }
  }, [currentKey, pendingKey]);

  const value = useMemo<TableLoadingContextValue>(
    () => ({
      isLoading,
      startLoading: (targetHref) => {
        setIsLoading(true);
        setPendingKey(targetHref ?? null);
      },
    }),
    [isLoading],
  );

  return (
    <TableLoadingContext.Provider value={value}>
      <div className={cn("relative", className)} aria-busy={isLoading}>
        {children}
        {isLoading ? <TableLoadingOverlay label={overlayLabel} /> : null}
      </div>
    </TableLoadingContext.Provider>
  );
}

export function useTableLoadingState() {
  return useContext(TableLoadingContext);
}

type TableLoadingFormProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "action" | "onSubmit"
> & {
  actionPath?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function TableLoadingForm({
  actionPath,
  children,
  onSubmit,
  className,
  ...props
}: TableLoadingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tableLoading = useTableLoadingState();

  return (
    <form
      {...props}
      className={className}
      onSubmit={(event) => {
        onSubmit?.(event);
        if (event.defaultPrevented) return;

        event.preventDefault();
        const targetPath = actionPath ?? pathname;
        const formData = new FormData(event.currentTarget);
        const href = buildTargetHref(targetPath, formData);
        tableLoading?.startLoading(href);
        router.push(href, { scroll: false });
      }}
    >
      {children}
    </form>
  );
}

type TableLoadingLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href"
> & {
  href: string;
};

export function TableLoadingLink({
  href,
  onClick,
  scroll = false,
  ...props
}: TableLoadingLinkProps) {
  const tableLoading = useTableLoadingState();

  return (
    <Link
      {...props}
      href={href}
      scroll={scroll}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        tableLoading?.startLoading(href);
      }}
    />
  );
}

type TableLoadingSubmitButtonProps = Omit<ButtonProps, "type"> & {
  pendingLabel?: ReactNode;
};

export function TableLoadingSubmitButton({
  children,
  disabled,
  pendingLabel = "Memuat...",
  ...props
}: TableLoadingSubmitButtonProps) {
  const tableLoading = useTableLoadingState();
  const isLoading = tableLoading?.isLoading ?? false;

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? <LoadingIndicator label={pendingLabel} /> : children}
    </Button>
  );
}
