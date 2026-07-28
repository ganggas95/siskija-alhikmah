"use client";

import { type SortState } from "@/lib/table-sort";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface SortableHeaderProps {
  column: string;
  label: string;
  sort: SortState;
  baseHref: string;
  currentSearchParams: Record<string, string | string[] | undefined>;
}

export function SortableHeader({
  column,
  label,
  sort,
  baseHref,
  currentSearchParams,
}: SortableHeaderProps) {
  const isActive = sort.column === column;
  const nextDirection = isActive && sort.direction === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();

  // Copy existing params except sort
  Object.entries(currentSearchParams).forEach(([key, value]) => {
    if (key !== "sort" && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
  });

  // Toggle sort: if clicking same column with asc -> desc, desc -> clear
  if (isActive && sort.direction === "desc") {
    // Clear sort - don't add sort param
  } else {
    params.set("sort", `${column}:${nextDirection}`);
  }

  const queryString = params.toString();
  const href = `${baseHref}${queryString ? `?${queryString}` : ""}`;

  const Icon = isActive
    ? sort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-green-800 ${
        isActive ? "font-semibold text-green-800" : "text-slate-600"
      }`}
    >
      {label}
      <Icon
        className={`h-4 w-4 transition-colors ${
          isActive
            ? "text-green-800"
            : "text-slate-400 group-hover:text-slate-600"
        }`}
      />
    </Link>
  );
}
