import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser } from '../../../_lib/auth.js'

export async function onRequestGet({ env, params }) {
  try {
    const postId = parseInt(params.id, 10)
    if (!postId) return badRequest('Invalid post id')

    const { results } = await env.DB.prepare(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.display_name
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? AND c.status = 'visible'
       ORDER BY c.created_at ASC`
    ).bind(postId).all()
    return json({ comments: results })
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

    const body = await request.json().catch(() => null)
    const content = String(body?.content || '').trim()
    if (content.length < 1 || content.length > 2000) {
      return badRequest('Comment must be 1-2000 characters')
    }

    const post = await env.DB.prepare(
      `SELECT id FROM posts WHERE id = ? AND status = 'published'`
    ).bind(postId).first()
    if (!post) return notFound('Post not found')

    const now = Math.floor(Date.now() / 1000)
    const result = await env.DB.prepare(
      `INSERT INTO comments (post_id, user_id, content, status, created_at)
       VALUES (?, ?, ?, 'visible', ?)`
    ).bind(postId, auth.user.id, content, now).run()

    return json({
      comment: {
        id: result.meta.last_row_id,
        content, created_at: now,
        user_id: auth.user.id,
        display_name: auth.user.display_name,
      },
    })
  } catch (e) {
    return serverError(e.message)
  }
}
