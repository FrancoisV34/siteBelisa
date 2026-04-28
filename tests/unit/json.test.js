import { describe, it, expect, vi } from 'vitest'
import { json, badRequest, notFound, serverError } from '../../functions/_lib/json.js'

describe('json helpers', () => {
  it('json() returns a Response with JSON body and content-type', async () => {
    const res = json({ ok: true })
    expect(res).toBeInstanceOf(Response)
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(await res.json()).toEqual({ ok: true })
    expect(res.status).toBe(200)
  })

  it('json() respects custom status and merges headers', async () => {
    const res = json({ a: 1 }, { status: 201, headers: { 'x-extra': 'yes' } })
    expect(res.status).toBe(201)
    expect(res.headers.get('x-extra')).toBe('yes')
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8')
  })

  it('badRequest() returns 400 with error message', async () => {
    const res = badRequest('bad')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'bad' })
  })

  it('notFound() defaults to "Not found"', async () => {
    const res = notFound()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })

  it('serverError() always returns generic "Internal error", never leaks args', async () => {
    const res = serverError()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal error' })
  })

  it('serverError() ignores its argument in the response body', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const leaky = 'D1_ERROR: UNIQUE constraint failed: users.email'
    const res = serverError(leaky)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal error' })
    expect(JSON.stringify(body)).not.toContain('D1_ERROR')
    expect(JSON.stringify(body)).not.toContain('users.email')
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
