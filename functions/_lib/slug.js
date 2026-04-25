export function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}

export async function uniqueSlug(env, base, excludeId = null) {
  let slug = base
  let i = 1
  while (true) {
    const row = excludeId
      ? await env.DB.prepare(`SELECT id FROM posts WHERE slug = ? AND id != ?`).bind(slug, excludeId).first()
      : await env.DB.prepare(`SELECT id FROM posts WHERE slug = ?`).bind(slug).first()
    if (!row) return slug
    i += 1
    slug = `${base}-${i}`
  }
}
