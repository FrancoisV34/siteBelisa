import { json } from './json.js'
import { requireUser, requireRole } from './auth.js'

export async function adminOnly(request, env) {
  const auth = await requireUser(request, env)
  if (auth.error) return { error: auth.error }
  if (!requireRole(auth.user, 'admin')) {
    return { error: json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user: auth.user }
}
