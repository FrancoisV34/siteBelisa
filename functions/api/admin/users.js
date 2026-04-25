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
      `SELECT id, email, display_name, role, status, created_at FROM users ORDER BY created_at DESC`
    ).all()
    return json({ users: results })
  } catch (e) {
    return serverError(e.message)
  }
}
