export function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/\s+/g, " ")
    .replace(/[\u2018\u2019]/g, "'") // smart quotes to ascii
    .replace(/[\u201C\u201D]/g, '"');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

