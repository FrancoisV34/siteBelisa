import { json, serverError } from '../../_lib/json.js'
import { requireUser, requireRole } from '../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200)
    const { results } = await env.DB.prepare(
      `SELECT c.id, c.content, c.status, c.created_at,
              u.id AS user_id, u.display_name,
              p.id AS post_id, p.slug AS post_slug, p.title AS post_title
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       ORDER BY c.created_at DESC LIMIT ?`
    ).bind(limit).all()
    return json({ comments: results })
  } catch (e) {
    return serverError(e.message)
  }
}
