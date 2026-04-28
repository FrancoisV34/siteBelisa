import { describe, it, expect } from 'vitest'
import { onRequestPatch } from '../../functions/api/admin/users/[id].js'

function adminSession({ id = 1 } = {}) {
  return { id, email: 'a@b.c', display_name: 'A', role: 'admin', status: 'active', token: 't' }
}

function makeEnv({ session, target } = {}) {
  const calls = []
  const batches = []
  return {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => {
          calls.push({ sql, args })
          return {
            first: async () => {
              if (sql.includes('FROM sessions s JOIN users u')) return session
              if (sql.includes('FROM users WHERE id')) return target
              return null
            },
            run: async () => ({ success: true }),
          }
        },
      }),
      batch: async (stmts) => {
        batches.push(stmts)
        return []
      },
      _calls: calls,
      _batches: batches,
    },
  }
}

function reqPatch(body) {
  return new Request('http://x/', {
    method: 'PATCH',
    headers: { cookie: 'sb_session=t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/admin/users/[id] — ban cascade', () => {
  it('on transition active -> banned, batches 3 cascade UPDATEs', async () => {
    const env = makeEnv({
      session: adminSession({ id: 1 }),
      target: { id: 7, role: 'user', status: 'active' },
    })
    const res = await onRequestPatch({
      request: reqPatch({ status: 'banned' }),
      env,
      params: { id: '7' },
    })
    expect(res.status).toBe(200)
    expect(env.DB._batches.length).toBe(1)
    expect(env.DB._batches[0]).toHaveLength(3)
    // Verify the 3 cascades were prepared
    const cascadeSqls = env.DB._calls
      .map((c) => c.sql)
      .filter((s) => s.includes('UPDATE') && (s.includes('posts') || s.includes('comments') || s.includes('guestbook')))
    expect(cascadeSqls.find((s) => s.includes('UPDATE posts SET status'))).toBeDefined()
    expect(cascadeSqls.find((s) => s.includes('UPDATE comments SET status'))).toBeDefined()
    expect(cascadeSqls.find((s) => s.includes('UPDATE guestbook SET status'))).toBeDefined()
  })

  it('does not re-cascade when target is already banned (idempotent)', async () => {
    const env = makeEnv({
      session: adminSession({ id: 1 }),
      target: { id: 7, role: 'user', status: 'banned' },
    })
    const res = await onRequestPatch({
      request: reqPatch({ status: 'banned' }),
      env,
      params: { id: '7' },
    })
    expect(res.status).toBe(200)
    expect(env.DB._batches.length).toBe(0)
  })

  it('does not cascade on unban (banned -> active)', async () => {
    const env = makeEnv({
      session: adminSession({ id: 1 }),
      target: { id: 7, role: 'user', status: 'banned' },
    })
    const res = await onRequestPatch({
      request: reqPatch({ status: 'active' }),
      env,
      params: { id: '7' },
    })
    expect(res.status).toBe(200)
    expect(env.DB._batches.length).toBe(0)
  })

  it('rejects self-modification (admin cannot ban themselves)', async () => {
    const env = makeEnv({
      session: adminSession({ id: 1 }),
      target: { id: 1, role: 'admin', status: 'active' },
    })
    const res = await onRequestPatch({
      request: reqPatch({ status: 'banned' }),
      env,
      params: { id: '1' },
    })
    expect(res.status).toBe(400)
    expect(env.DB._batches.length).toBe(0)
  })

  it('returns 403 for non-admin caller', async () => {
    const env = makeEnv({
      session: { ...adminSession({ id: 1 }), role: 'user' },
      target: { id: 7, role: 'user', status: 'active' },
    })
    const res = await onRequestPatch({
      request: reqPatch({ status: 'banned' }),
      env,
      params: { id: '7' },
    })
    expect(res.status).toBe(403)
    expect(env.DB._batches.length).toBe(0)
  })
})
