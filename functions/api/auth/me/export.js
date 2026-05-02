import { serverError } from '../../../_lib/json.js'
import { getCurrentUser } from '../../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  try {
    const user = await getCurrentUser(request, env)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }

    const [comments, guestbook, posts, likes] = await Promise.all([
      env.DB.prepare(
        `SELECT id, post_id, content, status, created_at FROM comments WHERE user_id = ? ORDER BY created_at`
      ).bind(user.id).all(),
      env.DB.prepare(
        `SELECT id, message, status, created_at FROM guestbook WHERE user_id = ? ORDER BY created_at`
      ).bind(user.id).all(),
      env.DB.prepare(
        `SELECT id, slug, title, excerpt, cover_image, content_html, status, published_at, created_at, updated_at
         FROM posts WHERE author_id = ? ORDER BY created_at`
      ).bind(user.id).all(),
      env.DB.prepare(
        `SELECT post_id, created_at FROM likes WHERE user_id = ? ORDER BY created_at`
      ).bind(user.id).all(),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
      comments: comments.results || [],
      guestbook: guestbook.results || [],
      posts: posts.results || [],
      likes: likes.results || [],
    }

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="belisa-data-export-${user.id}.json"`,
      },
    })
  } catch (e) {
    return serverError(e.message)
  }
}
