import { describe, it, expect, vi } from 'vitest'
import {
  parseCookies,
  sessionCookie,
  clearSessionCookie,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  deleteSessionsForUser,
  getCurrentUser,
  requireUser,
  requireRole,
} from '../../functions/_lib/auth.js'

function reqWith(cookieHeader) {
  return new Request('http://x/', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

function makeDB({ row = null, runs = [] } = {}) {
  const calls = []
  return {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => {
          calls.push({ sql, args })
          return {
            first: async () => row,
            run: async () => ({ success: true }),
          }
        },
      }),
      _calls: calls,
    },
  }
}

describe('parseCookies', () => {
  it('parses a single cookie', () => {
    const req = reqWith('sb_session=abc123')
    expect(parseCookies(req)).toEqual({ sb_session: 'abc123' })
  })

  it('parses multiple cookies and trims whitespace', () => {
    const req = reqWith('a=1; b=2;c=3')
    expect(parseCookies(req)).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('decodes URI-encoded values', () => {
    const req = reqWith('x=hello%20world')
    expect(parseCookies(req).x).toBe('hello world')
  })

  it('returns empty object when no cookie header', () => {
    expect(parseCookies(reqWith(null))).toEqual({})
  })

  it('handles cookies with = in value', () => {
    const req = reqWith('token=a=b=c')
    expect(parseCookies(req).token).toBe('a=b=c')
  })
})

describe('sessionCookie / clearSessionCookie', () => {
  it('builds cookie with all security flags', () => {
    const c = sessionCookie('abc', 3600)
    expect(c).toContain('sb_session=abc')
    expect(c).toContain('HttpOnly')
    expect(c).toContain('Secure')
    expect(c).toContain('SameSite=Lax')
    expect(c).toContain('Path=/')
    expect(c).toContain('Max-Age=3600')
  })

  it('clearSessionCookie sets Max-Age=0', () => {
    const c = clearSessionCookie()
    expect(c).toContain('sb_session=')
    expect(c).toContain('Max-Age=0')
    expect(c).toContain('HttpOnly')
    expect(c).toContain('Secure')
  })
})

describe('hashPassword / verifyPassword', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('hunter2')
    expect(await verifyPassword('hunter2', hash)).toBe(true)
  }, 10_000)

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('hunter2')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  }, 10_000)

  it('produces different hashes for the same password (salt)', async () => {
    const a = await hashPassword('same')
    const b = await hashPassword('same')
    expect(a).not.toBe(b)
  }, 10_000)
})

describe('createSession', () => {
  it('inserts a session and returns token + maxAge', async () => {
    const env = makeDB()
    const result = await createSession(env, 42)
    expect(result.token).toMatch(/^[0-9a-f]{64}$/)
    expect(result.maxAge).toBe(30 * 24 * 3600)
    expect(env.DB._calls[0].sql).toMatch(/INSERT INTO sessions/)
    expect(env.DB._calls[0].args[1]).toBe(42)
  })

  it('produces unique tokens', async () => {
    const env = makeDB()
    const a = await createSession(env, 1)
    const b = await createSession(env, 1)
    expect(a.token).not.toBe(b.token)
  })
})

describe('deleteSession / deleteSessionsForUser', () => {
  it('deleteSession runs DELETE by token', async () => {
    const env = makeDB()
    await deleteSession(env, 'tok')
    expect(env.DB._calls[0].sql).toMatch(/DELETE FROM sessions WHERE token/)
    expect(env.DB._calls[0].args).toEqual(['tok'])
  })

  it('deleteSessionsForUser runs DELETE by user_id', async () => {
    const env = makeDB()
    await deleteSessionsForUser(env, 7)
    expect(env.DB._calls[0].sql).toMatch(/DELETE FROM sessions WHERE user_id/)
    expect(env.DB._calls[0].args).toEqual([7])
  })
})

describe('getCurrentUser', () => {
  it('returns null when no cookie', async () => {
    const env = makeDB()
    expect(await getCurrentUser(reqWith(null), env)).toBeNull()
  })

  it('returns null when session not found', async () => {
    const env = makeDB({ row: null })
    expect(await getCurrentUser(reqWith('sb_session=tok'), env)).toBeNull()
  })

  it('returns the user when session is valid', async () => {
    const user = { id: 1, email: 'a@b.c', display_name: 'A', role: 'user', status: 'active' }
    const env = makeDB({ row: user })
    expect(await getCurrentUser(reqWith('sb_session=tok'), env)).toEqual(user)
  })

  it('returns null when user is banned', async () => {
    const banned = { id: 1, email: 'x', display_name: 'X', role: 'user', status: 'banned' }
    const env = makeDB({ row: banned })
    expect(await getCurrentUser(reqWith('sb_session=tok'), env)).toBeNull()
  })
})

describe('requireUser', () => {
  it('returns { user } when authenticated', async () => {
    const user = { id: 1, role: 'user', status: 'active' }
    const env = makeDB({ row: user })
    const out = await requireUser(reqWith('sb_session=t'), env)
    expect(out.user).toEqual(user)
  })

  it('returns { error } 401 when not authenticated', async () => {
    const env = makeDB()
    const out = await requireUser(reqWith(null), env)
    expect(out.error).toBeInstanceOf(Response)
    expect(out.error.status).toBe(401)
    expect(await out.error.json()).toEqual({ error: 'Authentication required' })
  })
})

describe('requireRole', () => {
  it('returns true when user role is in allowed list', () => {
    expect(requireRole({ role: 'admin' }, 'admin')).toBe(true)
    expect(requireRole({ role: 'user' }, 'user', 'admin')).toBe(true)
  })

  it('returns false when not in allowed list', () => {
    expect(requireRole({ role: 'user' }, 'admin')).toBe(false)
    expect(requireRole({ role: 'guest' }, 'admin', 'user')).toBe(false)
  })
})
