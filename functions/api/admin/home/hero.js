import { json, badRequest, serverError } from '../../../_lib/json.js'
import { requireUser, requireRole } from '../../../_lib/auth.js'
import { sanitizePlainText } from '../../../_lib/sanitize.js'

const KEYS = ['home.hero_title', 'home.hero_subtitle']

async function gateAdminOrAuthor(request, env) {
  const auth = await requireUser(request, env)
  if (auth.error) return { error: auth.error }
  if (!requireRole(auth.user, 'admin')) {
    return { error: json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user: auth.user }
}

export async function onRequestGet({ request, env }) {
  try {
    const g = await gateAdminOrAuthor(request, env)
    if (g.error) return g.error
    const { results } = await env.DB.prepare(
      `SELECT key, value FROM site_settings WHERE key IN (?, ?)`
    ).bind(...KEYS).all()
    const map = Object.fromEntries((results || []).map((r) => [r.key, r.value]))
    return json({
      title: map['home.hero_title'] || '',
      subtitle: map['home.hero_subtitle'] || '',
    })
  } catch (e) {
    return serverError(e.message)
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const g = await gateAdminOrAuthor(request, env)
    if (g.error) return g.error
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Invalid JSON body')

    const title = sanitizePlainText(body.title).trim().slice(0, 200)
    const subtitle = sanitizePlainText(body.subtitle).trim().slice(0, 300)
    if (!title) return badRequest('Title is required')

    const now = Math.floor(Date.now() / 1000)
    const stmt = env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
    )
    await env.DB.batch([
      stmt.bind('home.hero_title', title, now),
      stmt.bind('home.hero_subtitle', subtitle, now),
    ])
    return json({ title, subtitle })
  } catch (e) {
    return serverError(e.message)
  }
}
