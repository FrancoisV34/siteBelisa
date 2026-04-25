import { json, serverError } from '../../_lib/json.js'
import { requireUser, requireRole } from '../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const { results } = await env.DB.prepare(
      `SELECT g.id, g.message, g.status, g.created_at, u.id AS user_id, u.display_name
       FROM guestbook g JOIN users u ON u.id = g.user_id
       ORDER BY g.created_at DESC LIMIT 200`
    ).all()
    return json({ entries: results })
  } catch (e) {
    return serverError(e.message)
  }
}
