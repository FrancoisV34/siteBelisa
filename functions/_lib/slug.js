export function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}

// A table name cannot be bound as a parameter, so only these two literals are
// ever interpolated — the caller's string is never used directly.
const SLUG_TABLES = { posts: 'posts', oeuvres: 'oeuvres' }

export async function uniqueSlugIn(env, table, base, excludeId = null) {
  const safeTable = SLUG_TABLES[table]
  if (!safeTable) throw new Error(`Unknown slug table: ${table}`)

  let slug = base
  let i = 1
  while (true) {
    const row = excludeId
      ? await env.DB.prepare(`SELECT id FROM ${safeTable} WHERE slug = ? AND id != ?`).bind(slug, excludeId).first()
      : await env.DB.prepare(`SELECT id FROM ${safeTable} WHERE slug = ?`).bind(slug).first()
    if (!row) return slug
    i += 1
    slug = `${base}-${i}`
  }
}

export function uniqueSlug(env, base, excludeId = null) {
  return uniqueSlugIn(env, 'posts', base, excludeId)
}
