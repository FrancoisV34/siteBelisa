import { json, badRequest, serverError } from '../../../_lib/json.js'
import { adminOrAuthor } from '../../../_lib/admin-gate.js'

export async function onRequestGet({ request, env }) {
  try {
    const g = await adminOrAuthor(request, env)
    if (g.error) return g.error
    const { results } = await env.DB.prepare(
      `SELECT id, title, year, technique, dimensions, description, image_url,
              book_url, ebook_url, position, status, updated_at
       FROM oeuvres ORDER BY position ASC, id ASC`
    ).all()
    return json({ oeuvres: results || [] })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const g = await adminOrAuthor(request, env)
    if (g.error) return g.error
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = String(body.title || '').trim()
    if (!title) return badRequest('Title required')
    const year = body.year ? parseInt(body.year, 10) || null : null
    const technique = body.technique ? String(body.technique).trim().slice(0, 200) : null
    const dimensions = body.dimensions ? String(body.dimensions).trim().slice(0, 100) : null
    const description = body.description ? String(body.description).trim().slice(0, 2000) : null
    const imageUrl = body.image_url ? String(body.image_url).trim().slice(0, 500) : null
    const bookUrl = body.book_url ? String(body.book_url).trim().slice(0, 500) : null
    const ebookUrl = body.ebook_url ? String(body.ebook_url).trim().slice(0, 500) : null
    const status = body.status === 'hidden' ? 'hidden' : 'visible'

    const max = await env.DB.prepare(`SELECT COALESCE(MAX(position), -1) AS m FROM oeuvres`).first()
    const position = (max?.m ?? -1) + 1

    const now = Math.floor(Date.now() / 1000)
    const r = await env.DB.prepare(
      `INSERT INTO oeuvres (title, year, technique, dimensions, description, image_url, book_url, ebook_url, position, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(title, year, technique, dimensions, description, imageUrl, bookUrl, ebookUrl, position, status, now, now).run()

    return json({ oeuvre: { id: r.meta.last_row_id, title, year, technique, dimensions, description, image_url: imageUrl, book_url: bookUrl, ebook_url: ebookUrl, position, status } })
  } catch (e) {
    return serverError(e.message)
  }
}
