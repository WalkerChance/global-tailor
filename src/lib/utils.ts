/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Parse a user-entered dollar amount into integer minor units (cents).
 * Returns null for blank/invalid input. Money is never stored as a float.
 */
export function parseDollarsToCents(input: FormDataEntryValue | null): number | null {
  if (input == null) return null;
  const raw = String(input).trim().replace(/[$,]/g, "");
  if (raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Format integer cents as dollars for editable inputs (no currency symbol). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

/**
 * Restrict a post-auth redirect target to a local path, preventing open
 * redirects. Accepts only "/path" (not "//host", not "/\\host", not absolute).
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/account",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** True only for http(s) URLs — used to gate user-supplied links (tracking). */
export function isHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
