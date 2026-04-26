import { json, badRequest, serverError } from '../../../../_lib/json.js'
import { adminOnly } from '../../../../_lib/admin-gate.js'
import { sanitizePlainText } from '../../../../_lib/sanitize.js'

export async function onRequestGet({ request, env }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const { results } = await env.DB.prepare(
      `SELECT id, number, label, position FROM home_stats ORDER BY position ASC, id ASC`
    ).all()
    return json({ stats: results || [] })
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

    const number = sanitizePlainText(body.number).trim().slice(0, 20)
    const label = sanitizePlainText(body.label).trim().slice(0, 80)
    if (!number || !label) return badRequest('Number and label required')

    const max = await env.DB.prepare(
      `SELECT COALESCE(MAX(position), -1) AS m FROM home_stats`
    ).first()
    const position = (max?.m ?? -1) + 1
    const now = Math.floor(Date.now() / 1000)
    const r = await env.DB.prepare(
      `INSERT INTO home_stats (number, label, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(number, label, position, now, now).run()
    return json({ stat: { id: r.meta.last_row_id, number, label, position } })
  } catch (e) {
    return serverError(e.message)
  }
}
