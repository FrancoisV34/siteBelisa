import { json, badRequest, serverError } from '../_lib/json.js'
import { requireUser } from '../_lib/auth.js'
import { sanitizePlainText } from '../_lib/sanitize.js'

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const { results } = await env.DB.prepare(
      `SELECT g.id, g.message, g.created_at, u.display_name
       FROM guestbook g JOIN users u ON u.id = g.user_id
       WHERE g.status = 'visible' AND u.status = 'active'
       ORDER BY g.created_at DESC LIMIT ?`
    ).bind(limit).all()
    return json({ entries: results })
  } catch (e) {
    return serverError(e)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error
    const body = await request.json().catch(() => null)
    const message = sanitizePlainText(body?.message).trim()
    if (message.length < 1 || message.length > 500) {
      return badRequest('Message must be 1-500 characters')
    }
    const now = Math.floor(Date.now() / 1000)
    const r = await env.DB.prepare(
      `INSERT INTO guestbook (user_id, message, status, created_at)
       VALUES (?, ?, 'visible', ?)`
    ).bind(auth.user.id, message, now).run()
    return json({
      entry: {
        id: r.meta.last_row_id,
        message, created_at: now,
        display_name: auth.user.display_name,
      },
    })
  } catch (e) {
    return serverError(e.message)
  }
}
