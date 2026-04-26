import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'sb_session'
const SESSION_DAYS = 30

export function parseCookies(request) {
  const header = request.headers.get('cookie') || ''
  const out = {}
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (!k) continue
    out[k] = decodeURIComponent(rest.join('='))
  }
  return out
}

function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function sessionCookie(token, maxAgeSec) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ]
  return parts.join('; ')
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export async function createSession(env, userId) {
  const token = randomToken()
  const now = Math.floor(Date.now() / 1000)
  const expires = now + SESSION_DAYS * 24 * 3600
  await env.DB.prepare(
    `INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`
  ).bind(token, userId, expires, now).run()
  return { token, maxAge: SESSION_DAYS * 24 * 3600 }
}

export async function deleteSession(env, token) {
  await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run()
}

export async function deleteSessionsForUser(env, userId) {
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId).run()
}

export async function getCurrentUser(request, env) {
  const cookies = parseCookies(request)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const now = Math.floor(Date.now() / 1000)
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.role, u.status, u.created_at, s.token
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`
  ).bind(token, now).first()
  if (!row) return null
  if (row.status === 'banned') return null
  return row
}

export async function requireUser(request, env) {
  const user = await getCurrentUser(request, env)
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    }
  }
  return { user }
}

export function requireRole(user, ...allowed) {
  return allowed.includes(user.role)
}
