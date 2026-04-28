import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser } from '../../../_lib/auth.js'
import { slugify, uniqueSlug } from '../../../_lib/slug.js'
import { sanitizeRichText, sanitizePlainText, sanitizeCoverImage } from '../../../_lib/sanitize.js'

async function loadOwnedPost(env, params, userId) {
  const id = parseInt(params.id, 10)
  if (!id) return { error: badRequest('Invalid id') }
  const post = await env.DB.prepare(
    `SELECT id, author_id, slug, title, content_html, excerpt, cover_image, status, published_at, created_at, updated_at
     FROM posts WHERE id = ?`
  ).bind(id).first()
  if (!post || post.author_id !== userId) return { error: notFound('Post not found') }
  return { post }
}

export async function onRequestGet({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    const r = await loadOwnedPost(env, params, auth.user.id)
    if (r.error) return r.error
    return json({ post: r.post })
  } catch (e) {
    return serverError(e)
  }
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    const r = await loadOwnedPost(env, params, auth.user.id)
    if (r.error) return r.error
    const post = r.post

    if (post.status !== 'pending') {
      return json(
        { error: 'Cette proposition ne peut plus être modifiée (déjà traitée).' },
        { status: 409 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = body.title !== undefined ? sanitizePlainText(body.title).trim() : post.title
    const contentHtml = body.content_html !== undefined
      ? sanitizeRichText(String(body.content_html).trim())
      : post.content_html
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

    if (title.length < 1 || title.length > 200) return badRequest('Title must be 1-200 chars')
    if (contentHtml.length < 1) return badRequest('Content required')

    let slug = post.slug
    if (title !== post.title) slug = await uniqueSlug(env, slugify(title), post.id)

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `UPDATE posts SET title=?, slug=?, content_html=?, excerpt=?, cover_image=?, updated_at=?
       WHERE id = ?`
    ).bind(title, slug, contentHtml, excerpt, coverImage, now, post.id).run()

    return json({ post: { id: post.id, slug, title, status: post.status } })
  } catch (e) {
    return serverError(e)
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    const r = await loadOwnedPost(env, params, auth.user.id)
    if (r.error) return r.error

    if (r.post.status !== 'pending') {
      return json(
        { error: 'Cette proposition ne peut plus être retirée (déjà traitée).' },
        { status: 409 }
      )
    }

    await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(r.post.id).run()
    return json({ ok: true })
  } catch (e) {
    return serverError(e)
  }
}
