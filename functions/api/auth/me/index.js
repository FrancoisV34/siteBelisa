import { json, badRequest, serverError } from '../../../_lib/json.js'
import { getCurrentUser, clearSessionCookie } from '../../../_lib/auth.js'
import { sanitizePlainText } from '../../../_lib/sanitize.js'

const GHOST_EMAIL = 'deleted-user@belisa.local'

function userPayload(u) {
  return {
    id: u.id,
    email: u.email,
    display_name: u.display_name,
    role: u.role,
    created_at: u.created_at,
  }
}

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ user: null })
  return json({ user: userPayload(user) })
}

export async function onRequestPatch({ request, env }) {
  try {
    const user = await getCurrentUser(request, env)
    if (!user) return json({ error: 'Authentication required' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const displayName = sanitizePlainText(body.display_name).trim()
    if (displayName.length < 2 || displayName.length > 60) {
      return badRequest('Display name must be 2-60 characters')
    }

    await env.DB.prepare(`UPDATE users SET display_name = ? WHERE id = ?`)
      .bind(displayName, user.id).run()

    return json({ user: userPayload({ ...user, display_name: displayName }) })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await getCurrentUser(request, env)
    if (!user) return json({ error: 'Authentication required' }, { status: 401 })

    const ghost = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`)
      .bind(GHOST_EMAIL).first()
    if (!ghost) return serverError('Ghost user missing — apply migration 0004')
    if (user.id === ghost.id) return badRequest('Cannot delete the ghost user')

    await env.DB.batch([
      env.DB.prepare(`UPDATE comments SET user_id = ? WHERE user_id = ?`).bind(ghost.id, user.id),
      env.DB.prepare(`UPDATE guestbook SET user_id = ? WHERE user_id = ?`).bind(ghost.id, user.id),
      env.DB.prepare(`UPDATE posts SET author_id = ? WHERE author_id = ?`).bind(ghost.id, user.id),
      env.DB.prepare(`DELETE FROM likes WHERE user_id = ?`).bind(user.id),
      env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(user.id),
      env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id),
    ])

    return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } })
  } catch (e) {
    return serverError(e.message)
  }
}
