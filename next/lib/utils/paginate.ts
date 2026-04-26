/**
 * Generic pagination helper for list endpoints.
 * Reads `?page=` and `?limit=` from URLSearchParams and returns a slice.
 */
export function paginateList<T>(items: T[], searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total: items.length, page, limit };
}
