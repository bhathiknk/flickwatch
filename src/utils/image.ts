/**
 * Image URL helpers for TMDB.
 * Keep it centralized so you can swap sizes or handle nulls consistently.
 */

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "original";

/**
 * Build a full TMDB image URL from a path.
 * Returns null if the path is missing.
 */
export function buildImageUrl(
  path: string | null | undefined,
  size: ImageSize = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getPosterUrl(path: string | null | undefined, size: ImageSize = "w500") {
  return buildImageUrl(path, size);
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: ImageSize = "w780"
) {
  return buildImageUrl(path, size);
}

export function getProfileUrl(
  path: string | null | undefined,
  size: ImageSize = "w185"
) {
  return buildImageUrl(path, size);
}

/**
 * Extract year from a date string like "2024-08-10".
 * Useful for showing release year in cards.
 */
export function getYear(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.length < 4) return "";
  return dateStr.slice(0, 4);
}
