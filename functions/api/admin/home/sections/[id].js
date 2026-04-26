import { json, badRequest, notFound, serverError } from '../../../../_lib/json.js'
import { adminOnly } from '../../../../_lib/admin-gate.js'
import { sanitizeRichText, sanitizePlainText } from '../../../../_lib/sanitize.js'

export async function onRequestGet({ request, env, params }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const row = await env.DB.prepare(
      `SELECT id, title, body_html, image_url, position, status FROM home_sections WHERE id = ?`
    ).bind(id).first()
    if (!row) return notFound('Section not found')
    return json({ section: row })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const existing = await env.DB.prepare(
      `SELECT * FROM home_sections WHERE id = ?`
    ).bind(id).first()
    if (!existing) return notFound('Section not found')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = body.title !== undefined ? sanitizePlainText(body.title).trim() : existing.title
    const bodyHtml = body.body_html !== undefined ? sanitizeRichText(String(body.body_html).trim()) : existing.body_html
    const imageUrl = body.image_url !== undefined
      ? (body.image_url ? String(body.image_url).trim().slice(0, 500) : null)
      : existing.image_url
    const status = body.status === 'visible' || body.status === 'hidden' ? body.status : existing.status

    if (!title) return badRequest('Title required')

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `UPDATE home_sections SET title=?, body_html=?, image_url=?, status=?, updated_at=? WHERE id=?`
    ).bind(title, bodyHtml, imageUrl, status, now, id).run()

    return json({ section: { id, title, body_html: bodyHtml, image_url: imageUrl, status, position: existing.position } })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const r = await env.DB.prepare(`DELETE FROM home_sections WHERE id = ?`).bind(id).run()
    if (r.meta.changes === 0) return notFound('Section not found')
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
