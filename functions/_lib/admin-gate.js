import { json } from './json.js'
import { requireUser, requireRole } from './auth.js'

export async function adminOrAuthor(request, env) {
  const auth = await requireUser(request, env)
  if (auth.error) return { error: auth.error }
  if (!requireRole(auth.user, 'admin', 'author')) {
    return { error: json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user: auth.user }
}
