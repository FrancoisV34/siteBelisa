import { json, badRequest, serverError } from '../../../../_lib/json.js'
import { adminOnly } from '../../../../_lib/admin-gate.js'

export async function onRequestGet({ request, env }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const { results } = await env.DB.prepare(
      `SELECT id, title, body_html, image_url, position, status, updated_at
       FROM home_sections ORDER BY position ASC, id ASC`
    ).all()
    return json({ sections: results || [] })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = String(body.title || '').trim()
    const bodyHtml = String(body.body_html || '').trim()
    const imageUrl = body.image_url ? String(body.image_url).trim().slice(0, 500) : null
    if (!title) return badRequest('Title required')

    const max = await env.DB.prepare(
      `SELECT COALESCE(MAX(position), -1) AS m FROM home_sections`
    ).first()
    const position = (max?.m ?? -1) + 1

    const now = Math.floor(Date.now() / 1000)
    const r = await env.DB.prepare(
      `INSERT INTO home_sections (title, body_html, image_url, position, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'visible', ?, ?)`
    ).bind(title, bodyHtml, imageUrl, position, now, now).run()

    return json({ section: { id: r.meta.last_row_id, title, body_html: bodyHtml, image_url: imageUrl, position, status: 'visible' } })
  } catch (e) {
    return serverError(e.message)
  }
}
