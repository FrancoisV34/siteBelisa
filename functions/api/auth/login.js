import { json, badRequest, serverError } from '../../_lib/json.js'
import { verifyPassword, createSession, sessionCookie } from '../../_lib/auth.js'
import { isLocked, lockoutSecondsRemaining, recordFailedLogin, resetLoginFails } from '../../_lib/lockout.js'

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || !password) return badRequest('Missing credentials')

    const user = await env.DB.prepare(
      `SELECT id, email, password_hash, display_name, role, status, login_fails, locked_until
       FROM users WHERE email = ?`
    ).bind(email).first()
    if (!user) return json({ error: 'Invalid credentials' }, { status: 401 })
    if (user.status === 'banned') return json({ error: 'Account suspended' }, { status: 403 })

    const now = Math.floor(Date.now() / 1000)
    if (isLocked(user, now)) {
      const retryAfter = lockoutSecondsRemaining(user, now)
      return json(
        { error: 'Trop de tentatives. Réessayez plus tard.', retry_after: retryAfter },
        { status: 429, headers: { 'retry-after': String(retryAfter) } }
      )
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      const { lockUntil } = await recordFailedLogin(env, user, now)
      if (lockUntil) {
        const retryAfter = lockUntil - now
        return json(
          { error: 'Trop de tentatives. Compte temporairement verrouillé.', retry_after: retryAfter },
          { status: 429, headers: { 'retry-after': String(retryAfter) } }
        )
      }
      return json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await resetLoginFails(env, user.id)

    const { token, maxAge } = await createSession(env, user.id)
    return json(
      {
        user: {
          id: user.id, email: user.email,
          display_name: user.display_name, role: user.role,
        },
      },
      { headers: { 'set-cookie': sessionCookie(token, maxAge) } }
    )
  } catch (e) {
    return serverError(e.message)
  }
}
