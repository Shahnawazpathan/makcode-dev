// Display-only branding: provider/model IDs must stay "opencode" for catalog
// and API lookups, so rebrand only the human-readable names at render time.
const BRAND_PATTERN = /opencode/gi

export function brandName(name: string) {
  return name.replace(BRAND_PATTERN, (match) => (match[0] === "o" ? "makcode" : "MakCode"))
}
