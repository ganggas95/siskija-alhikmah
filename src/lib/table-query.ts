export type QueryValue = string | string[] | undefined;
export type SearchParamsInput =
  | Record<string, QueryValue>
  | Promise<Record<string, QueryValue>>
  | undefined;

export type PaginationState = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export async function resolveSearchParams(searchParams: SearchParamsInput) {
  if (!searchParams) {
    return {} as Record<string, QueryValue>;
  }

  return await searchParams;
}

export function getQueryParam(
  searchParams: Record<string, QueryValue>,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function getPaginationState(
  searchParams: Record<string, QueryValue>,
  pageSize = 10,
): PaginationState {
  const rawPage = Number.parseInt(getQueryParam(searchParams, "page"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildQueryString(
  currentParams: Record<string, QueryValue>,
  updates: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentParams)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]?.trim()) {
      params.set(key, value[0]);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "" || value === "all") {
      params.delete(key);
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}
