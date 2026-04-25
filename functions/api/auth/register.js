import { json, badRequest, serverError } from '../../_lib/json.js'
import { hashPassword, createSession, sessionCookie } from '../../_lib/auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const displayName = String(body.display_name || '').trim()

    if (!EMAIL_RE.test(email)) return badRequest('Invalid email')
    if (password.length < 8) return badRequest('Password must be at least 8 characters')
    if (displayName.length < 2 || displayName.length > 60) {
      return badRequest('Display name must be 2-60 characters')
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM users WHERE email = ?`
    ).bind(email).first()
    if (existing) return badRequest('Email already registered')

    const hash = await hashPassword(password)
    const now = Math.floor(Date.now() / 1000)
    const result = await env.DB.prepare(
      `INSERT INTO users (email, password_hash, display_name, role, status, created_at)
       VALUES (?, ?, ?, 'user', 'active', ?)`
    ).bind(email, hash, displayName, now).run()

    const userId = result.meta.last_row_id
    const { token, maxAge } = await createSession(env, userId)

    return json(
      { user: { id: userId, email, display_name: displayName, role: 'user' } },
      { headers: { 'set-cookie': sessionCookie(token, maxAge) } }
    )
  } catch (e) {
    return serverError(e.message)
  }
}
