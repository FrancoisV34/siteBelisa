import { json, badRequest, notFound, serverError } from '../../../../_lib/json.js'
import { adminOnly } from '../../../../_lib/admin-gate.js'
import { sanitizePlainText } from '../../../../_lib/sanitize.js'

export async function onRequestPatch({ request, env, params }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const existing = await env.DB.prepare(`SELECT * FROM home_stats WHERE id = ?`).bind(id).first()
    if (!existing) return notFound('Stat not found')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const number = body.number !== undefined ? sanitizePlainText(body.number).trim().slice(0, 20) : existing.number
    const label = body.label !== undefined ? sanitizePlainText(body.label).trim().slice(0, 80) : existing.label
    if (!number || !label) return badRequest('Number and label required')

    const now = Math.floor(Date.now() / 1000)
    await env.DB.prepare(
      `UPDATE home_stats SET number=?, label=?, updated_at=? WHERE id=?`
    ).bind(number, label, now, id).run()
    return json({ stat: { id, number, label, position: existing.position } })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const id = parseInt(params.id, 10)
    const r = await env.DB.prepare(`DELETE FROM home_stats WHERE id = ?`).bind(id).run()
    if (r.meta.changes === 0) return notFound('Stat not found')
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
