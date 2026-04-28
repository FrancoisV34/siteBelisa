import { json, notFound, serverError } from '../../_lib/json.js'

export async function onRequestGet({ env, params }) {
  try {
    const post = await env.DB.prepare(
      `SELECT p.id, p.slug, p.title, p.content_html, p.excerpt, p.cover_image,
              p.published_at, u.display_name AS author_name
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.slug = ? AND p.status = 'published' AND u.status = 'active'`
    ).bind(params.slug).first()

    if (!post) return notFound('Post not found')
    return json({ post })
  } catch (e) {
    return serverError(e)
  }
}
