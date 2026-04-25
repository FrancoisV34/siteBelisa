import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser, requireRole, deleteSessionsForUser } from '../../../_lib/auth.js'

const ALLOWED_ROLES = ['user', 'author', 'admin']
const ALLOWED_STATUS = ['active', 'banned']

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = parseInt(params.id, 10)
    if (!id) return badRequest('Invalid id')
    if (id === auth.user.id) return badRequest('Cannot modify your own account')

    const target = await env.DB.prepare(
      `SELECT id, role, status FROM users WHERE id = ?`
    ).bind(id).first()
    if (!target) return notFound('User not found')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const role = body.role !== undefined ? body.role : target.role
    const status = body.status !== undefined ? body.status : target.status
    if (!ALLOWED_ROLES.includes(role)) return badRequest('Invalid role')
    if (!ALLOWED_STATUS.includes(status)) return badRequest('Invalid status')

    await env.DB.prepare(`UPDATE users SET role = ?, status = ? WHERE id = ?`)
      .bind(role, status, id).run()

    if (status === 'banned') await deleteSessionsForUser(env, id)

    return json({ user: { id, role, status } })
  } catch (e) {
    return serverError(e.message)
  }
}
