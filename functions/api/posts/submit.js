import { json, badRequest, serverError } from '../../_lib/json.js'
import { requireUser } from '../../_lib/auth.js'
import { slugify, uniqueSlug } from '../../_lib/slug.js'
import { sanitizeRichText, sanitizePlainText, sanitizeCoverImage } from '../../_lib/sanitize.js'

const MAX_PENDING_PER_USER = 5

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = sanitizePlainText(body.title).trim()
    const contentHtml = sanitizeRichText(String(body.content_html || '').trim())
    const excerpt = body.excerpt ? sanitizePlainText(body.excerpt).trim().slice(0, 300) : null
    let coverImage = null
    if (body.cover_image) {
      coverImage = sanitizeCoverImage(body.cover_image)
      if (!coverImage) return badRequest('Cover image must be an https:// URL or /r2/ path')
    }

    if (title.length < 1 || title.length > 200) return badRequest('Title must be 1-200 chars')
    if (contentHtml.length < 1) return badRequest('Content required')

    const pendingCount = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM posts WHERE author_id = ? AND status = 'pending'`
    ).bind(auth.user.id).first()
    if ((pendingCount?.n ?? 0) >= MAX_PENDING_PER_USER) {
      return json(
        { error: `Trop de propositions en attente (max ${MAX_PENDING_PER_USER}). Attendez la modération.` },
        { status: 429 }
      )
    }

    const slug = await uniqueSlug(env, slugify(title))
    const now = Math.floor(Date.now() / 1000)

    const result = await env.DB.prepare(
      `INSERT INTO posts (author_id, slug, title, content_html, excerpt, cover_image, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`
    ).bind(auth.user.id, slug, title, contentHtml, excerpt, coverImage, now, now).run()

    return json({
      post: { id: result.meta.last_row_id, slug, title, status: 'pending' },
    })
  } catch (e) {
    return serverError(e)
  }
}
