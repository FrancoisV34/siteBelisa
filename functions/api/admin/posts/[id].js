import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser, requireRole } from '../../../_lib/auth.js'
import { slugify, uniqueSlug } from '../../../_lib/slug.js'
import { sanitizeRichText, sanitizePlainText, sanitizeCoverImage } from '../../../_lib/sanitize.js'

async function loadAndCheck(env, params, user) {
  const id = parseInt(params.id, 10)
  if (!id) return { error: badRequest('Invalid id') }
  const post = await env.DB.prepare(
    `SELECT id, author_id, slug, title, content_html, excerpt, cover_image, status, published_at FROM posts WHERE id = ?`
  ).bind(id).first()
  if (!post) return { error: notFound('Post not found') }
  if (user.role !== 'admin' && post.author_id !== user.id) {
    return { error: json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { post }
}

export async function onRequestGet({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const r = await loadAndCheck(env, params, auth.user)
    if (r.error) return r.error
    return json({ post: r.post })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const r = await loadAndCheck(env, params, auth.user)
    if (r.error) return r.error
    const post = r.post

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = body.title !== undefined ? sanitizePlainText(body.title).trim() : post.title
    const contentHtml = body.content_html !== undefined ? sanitizeRichText(String(body.content_html).trim()) : post.content_html
    const excerpt = body.excerpt !== undefined
      ? (body.excerpt ? sanitizePlainText(body.excerpt).trim().slice(0, 300) : null)
      : post.excerpt
    let coverImage = post.cover_image
    if (body.cover_image !== undefined) {
      if (body.cover_image) {
        coverImage = sanitizeCoverImage(body.cover_image)
        if (!coverImage) return badRequest('Cover image must be an https:// URL or /r2/ path')
      } else {
        coverImage = null
      }
    }
    const newStatus = body.status === 'published' ? 'published'
                    : body.status === 'draft' ? 'draft'
                    : post.status

    if (title.length < 1 || title.length > 200) return badRequest('Title must be 1-200 chars')
    if (contentHtml.length < 1) return badRequest('Content required')

    let slug = post.slug
    if (title !== post.title) slug = await uniqueSlug(env, slugify(title), post.id)

    const now = Math.floor(Date.now() / 1000)
    let publishedAt = post.published_at
    if (newStatus === 'published' && !publishedAt) publishedAt = now
    if (newStatus === 'draft') publishedAt = null

    await env.DB.prepare(
      `UPDATE posts SET title=?, slug=?, content_html=?, excerpt=?, cover_image=?, status=?, published_at=?, updated_at=?
       WHERE id = ?`
    ).bind(title, slug, contentHtml, excerpt, coverImage, newStatus, publishedAt, now, post.id).run()

    return json({ post: { id: post.id, slug, title, status: newStatus } })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const r = await loadAndCheck(env, params, auth.user)
    if (r.error) return r.error
    await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(r.post.id).run()
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
