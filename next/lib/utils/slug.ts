/** Convert a raw string into a URL-safe slug. */
export function autoSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
