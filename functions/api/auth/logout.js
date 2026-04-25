import { json } from '../../_lib/json.js'
import { parseCookies, deleteSession, clearSessionCookie } from '../../_lib/auth.js'

export async function onRequestPost({ request, env }) {
  const token = parseCookies(request).sb_session
  if (token) await deleteSession(env, token)
  return json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie() } })
}
