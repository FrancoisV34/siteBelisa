import { json, badRequest, serverError } from '../../../_lib/json.js'
import { requireUser, requireRole } from '../../../_lib/auth.js'
import { slugify, uniqueSlug } from '../../../_lib/slug.js'
import { sanitizeRichText, sanitizePlainText } from '../../../_lib/sanitize.js'

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    // Admins see all posts; authors see only their own
    const sql = auth.user.role === 'admin'
      ? `SELECT p.id, p.slug, p.title, p.status, p.published_at, p.updated_at, u.display_name AS author_name
         FROM posts p JOIN users u ON u.id = p.author_id
         ORDER BY p.updated_at DESC`
      : `SELECT p.id, p.slug, p.title, p.status, p.published_at, p.updated_at, u.display_name AS author_name
         FROM posts p JOIN users u ON u.id = p.author_id
         WHERE p.author_id = ?
         ORDER BY p.updated_at DESC`
    const stmt = auth.user.role === 'admin'
      ? env.DB.prepare(sql)
      : env.DB.prepare(sql).bind(auth.user.id)
    const { results } = await stmt.all()
    return json({ posts: results })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = sanitizePlainText(body.title).trim()
    const contentHtml = sanitizeRichText(String(body.content_html || '').trim())
    const excerpt = body.excerpt ? sanitizePlainText(body.excerpt).trim().slice(0, 300) : null
    const coverImage = body.cover_image ? String(body.cover_image).trim().slice(0, 500) : null
    const status = body.status === 'published' ? 'published' : 'draft'

    if (title.length < 1 || title.length > 200) return badRequest('Title must be 1-200 chars')
    if (contentHtml.length < 1) return badRequest('Content required')

    const slug = await uniqueSlug(env, slugify(title))
    const now = Math.floor(Date.now() / 1000)
    const publishedAt = status === 'published' ? now : null

    const result = await env.DB.prepare(
      `INSERT INTO posts (author_id, slug, title, content_html, excerpt, cover_image, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      auth.user.id, slug, title, contentHtml, excerpt, coverImage, status, publishedAt, now, now
    ).run()

    return json({ post: { id: result.meta.last_row_id, slug, title, status } })
  } catch (e) {
    return serverError(e.message)
  }
}
