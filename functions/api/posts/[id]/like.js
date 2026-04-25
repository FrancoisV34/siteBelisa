import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser, getCurrentUser } from '../../../_lib/auth.js'

export async function onRequestGet({ request, env, params }) {
  try {
    const postId = parseInt(params.id, 10)
    if (!postId) return badRequest('Invalid post id')
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`
    ).bind(postId).first()
    const user = await getCurrentUser(request, env)
    let liked = false
    if (user) {
      const r = await env.DB.prepare(
        `SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?`
      ).bind(postId, user.id).first()
      liked = !!r
    }
    return json({ count: row.count, liked })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPost({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error

    const postId = parseInt(params.id, 10)
    if (!postId) return badRequest('Invalid post id')

    const post = await env.DB.prepare(
      `SELECT id FROM posts WHERE id = ? AND status = 'published'`
    ).bind(postId).first()
    if (!post) return notFound('Post not found')

    const existing = await env.DB.prepare(
      `SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?`
    ).bind(postId, auth.user.id).first()

    if (existing) {
      await env.DB.prepare(
        `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
      ).bind(postId, auth.user.id).run()
    } else {
      await env.DB.prepare(
        `INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)`
      ).bind(auth.user.id, postId, Math.floor(Date.now() / 1000)).run()
    }

    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM likes WHERE post_id = ?`
    ).bind(postId).first()
    return json({ count: row.count, liked: !existing })
  } catch (e) {
    return serverError(e.message)
  }
}
