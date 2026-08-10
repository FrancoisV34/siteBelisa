import { json, notFound, serverError } from '../../../_lib/json.js'

export async function onRequestGet({ env, params }) {
  try {
    const oeuvre = await env.DB.prepare(
      `SELECT id, slug, title, year, technique, dimensions, description,
              image_url, book_url, ebook_url, isbn, position
       FROM oeuvres WHERE slug = ? AND status = 'visible'`
    ).bind(params.slug).first()

    if (!oeuvre) return notFound('Oeuvre not found')

    // Neighbours power the previous/next links, which give crawlers a path
    // through the whole catalogue instead of leaving each page a dead end.
    const siblings = await env.DB.prepare(
      `SELECT slug, title, position FROM oeuvres
       WHERE status = 'visible' ORDER BY position ASC, id ASC`
    ).all()
    const list = siblings.results || []
    const idx = list.findIndex((o) => o.slug === oeuvre.slug)

    return json({
      oeuvre,
      prev: idx > 0 ? list[idx - 1] : null,
      next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
    })
  } catch (e) {
    return serverError(e.message)
  }
}
