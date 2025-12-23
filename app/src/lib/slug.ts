import crypto from "node:crypto";

export function safeSlug(input: string, prefix: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  if (base) return base;

  const hash = crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
  return `${prefix}-${hash}`;
}



