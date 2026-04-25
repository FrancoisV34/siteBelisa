import { json, serverError } from '../../_lib/json.js'

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0)

    const { results } = await env.DB.prepare(
      `SELECT p.id, p.slug, p.title, p.excerpt, p.cover_image, p.published_at,
              u.display_name AS author_name
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.status = 'published'
       ORDER BY p.published_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all()

    return json({ posts: results })
  } catch (e) {
    return serverError(e.message)
  }
}
