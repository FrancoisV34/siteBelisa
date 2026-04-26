import { describe, it, expect } from 'vitest'
import { adminOnly } from '../../functions/_lib/admin-gate.js'

function reqWith(cookieHeader) {
  return new Request('http://x/', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

function makeDB(row) {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => row,
          run: async () => ({ success: true }),
        }),
      }),
    },
  }
}

describe('adminOnly', () => {
  it('returns 401 error when no session', async () => {
    const out = await adminOnly(reqWith(null), makeDB(null))
    expect(out.error.status).toBe(401)
  })

  it('returns 403 error when user is not admin', async () => {
    const env = makeDB({ id: 1, role: 'user', status: 'active' })
    const out = await adminOnly(reqWith('sb_session=t'), env)
    expect(out.error.status).toBe(403)
    expect(await out.error.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns { user } when session belongs to an admin', async () => {
    const admin = { id: 1, email: 'a', display_name: 'A', role: 'admin', status: 'active' }
    const env = makeDB(admin)
    const out = await adminOnly(reqWith('sb_session=t'), env)
    expect(out.user).toEqual(admin)
    expect(out.error).toBeUndefined()
  })

  it('returns 401 when admin user is banned', async () => {
    const env = makeDB({ id: 1, role: 'admin', status: 'banned' })
    const out = await adminOnly(reqWith('sb_session=t'), env)
    expect(out.error.status).toBe(401)
  })
})
