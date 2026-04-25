import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { adminOrAuthor } from '../../../_lib/admin-gate.js'

export async function onRequestGet({ request, env, params }) {
  try {
    const g = await adminOrAuthor(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const row = await env.DB.prepare(`SELECT * FROM oeuvres WHERE id = ?`).bind(id).first()
    if (!row) return notFound('Oeuvre not found')
    return json({ oeuvre: row })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const g = await adminOrAuthor(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const existing = await env.DB.prepare(`SELECT * FROM oeuvres WHERE id = ?`).bind(id).first()
    if (!existing) return notFound('Oeuvre not found')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = body.title !== undefined ? String(body.title).trim() : existing.title
    const year = body.year !== undefined ? (body.year ? parseInt(body.year, 10) || null : null) : existing.year
    const technique = body.technique !== undefined ? (body.technique ? String(body.technique).trim().slice(0, 200) : null) : existing.technique
    const dimensions = body.dimensions !== undefined ? (body.dimensions ? String(body.dimensions).trim().slice(0, 100) : null) : existing.dimensions
    const description = body.description !== undefined ? (body.description ? String(body.description).trim().slice(0, 2000) : null) : existing.description
    const imageUrl = body.image_url !== undefined ? (body.image_url ? String(body.image_url).trim().slice(0, 500) : null) : existing.image_url
    const bookUrl = body.book_url !== undefined ? (body.book_url ? String(body.book_url).trim().slice(0, 500) : null) : existing.book_url
    const ebookUrl = body.ebook_url !== undefined ? (body.ebook_url ? String(body.ebook_url).trim().slice(0, 500) : null) : existing.ebook_url
    const status = body.status === 'visible' || body.status === 'hidden' ? body.status : existing.status

    if (!title) return badRequest('Title required')

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `UPDATE oeuvres SET title=?, year=?, technique=?, dimensions=?, description=?, image_url=?, book_url=?, ebook_url=?, status=?, updated_at=? WHERE id=?`
    ).bind(title, year, technique, dimensions, description, imageUrl, bookUrl, ebookUrl, status, now, id).run()

    return json({ oeuvre: { id, title, year, technique, dimensions, description, image_url: imageUrl, book_url: bookUrl, ebook_url: ebookUrl, status, position: existing.position } })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const g = await adminOrAuthor(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const r = await env.DB.prepare(`DELETE FROM oeuvres WHERE id = ?`).bind(id).run()
    if (r.meta.changes === 0) return notFound('Oeuvre not found')
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
