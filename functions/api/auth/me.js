import { json, badRequest, serverError } from '../../_lib/json.js'
import { getCurrentUser } from '../../_lib/auth.js'

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

    const displayName = String(body.display_name ?? '').trim()
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
