import { json, serverError } from '../../../_lib/json.js'
import { requireUser } from '../../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error

    const { results } = await env.DB.prepare(
      `SELECT id, slug, title, status, published_at, created_at, updated_at
       FROM posts
       WHERE author_id = ?
       ORDER BY updated_at DESC`
    ).bind(auth.user.id).all()

    return json({ posts: results || [] })
  } catch (e) {
    return serverError(e.message)
  }
}
