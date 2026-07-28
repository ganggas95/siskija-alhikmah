export type SortDirection = "asc" | "desc" | null;

export type SortState = {
  column: string | null;
  direction: SortDirection;
};

export function parseSortParam(sortParam: string | null | undefined): SortState {
  if (!sortParam) return { column: null, direction: null };
  
  const [column, direction] = sortParam.split(":");
  if (!column || (direction !== "asc" && direction !== "desc")) {
    return { column: null, direction: null };
  }
  
  return { column, direction };
}

export function buildSortParam(column: string, direction: SortDirection): string | null {
  if (!direction) return null;
  return `${column}:${direction}`;
}

export function toggleSort(column: string, currentState: SortState): SortState {
  // If clicking a different column, start with asc
  if (currentState.column !== column) {
    return { column, direction: "asc" };
  }
  
  // Toggle: asc -> desc -> null
  if (currentState.direction === "asc") {
    return { column, direction: "desc" };
  }
  
  // Clear sort
  return { column: null, direction: null };
}

export function getPrismaOrderBy(
  sortState: SortState,
  defaultColumn: string = "createdAt",
  defaultDirection: "asc" | "desc" = "desc"
): Record<string, "asc" | "desc"> {
  const column = sortState.column || defaultColumn;
  const direction = sortState.direction || defaultDirection;
  return { [column]: direction };
}
