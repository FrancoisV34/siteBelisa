import { json, badRequest, notFound, serverError } from '../../../_lib/json.js'
import { requireUser, requireRole } from '../../../_lib/auth.js'

const ALLOWED = ['visible', 'hidden']

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    if (!requireRole(auth.user, 'admin')) {
      return json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = parseInt(params.id, 10)
    if (!id) return badRequest('Invalid id')
    const body = await request.json().catch(() => null)
    if (!body || !ALLOWED.includes(body.status)) return badRequest('Invalid status')

    const r = await env.DB.prepare(`UPDATE guestbook SET status = ? WHERE id = ?`)
      .bind(body.status, id).run()
    if (r.meta.changes === 0) return notFound('Entry not found')
    return json({ ok: true })
  } catch (e) {
    return serverError(e.message)
  }
}
