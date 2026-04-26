import { json, badRequest, serverError } from '../../../../_lib/json.js'
import { adminOnly } from '../../../../_lib/admin-gate.js'

export async function onRequestPost({ request, env }) {
  try {
    const g = await adminOnly(request, env)
    if (g.error) return g.error
    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.items)) return badRequest('items[] required')
    const stmt = env.DB.prepare(`UPDATE home_stats SET position = ? WHERE id = ?`)
    const batch = body.items
      .filter((i) => Number.isInteger(i.id) && Number.isInteger(i.position))
      .map((i) => stmt.bind(i.position, i.id))
    if (batch.length) await env.DB.batch(batch)
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
