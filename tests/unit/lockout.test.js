import { describe, it, expect, vi } from 'vitest'
import {
  isLocked,
  lockoutSecondsRemaining,
  nextLockoutEpoch,
  recordFailedLogin,
  resetLoginFails,
} from '../../functions/_lib/lockout.js'

describe('isLocked', () => {
  it('returns false when locked_until is null', () => {
    expect(isLocked({ locked_until: null }, 1000)).toBe(false)
  })

  it('returns false when locked_until is in the past', () => {
    expect(isLocked({ locked_until: 500 }, 1000)).toBe(false)
  })

  it('returns true when locked_until is in the future', () => {
    expect(isLocked({ locked_until: 2000 }, 1000)).toBe(true)
  })
})

describe('lockoutSecondsRemaining', () => {
  it('returns 0 when not locked', () => {
    expect(lockoutSecondsRemaining({ locked_until: null }, 1000)).toBe(0)
  })

  it('returns difference when locked', () => {
    expect(lockoutSecondsRemaining({ locked_until: 1900 }, 1000)).toBe(900)
  })
})

describe('nextLockoutEpoch', () => {
  it('returns null below threshold', () => {
    expect(nextLockoutEpoch(1, 1000)).toBeNull()
    expect(nextLockoutEpoch(4, 1000)).toBeNull()
  })

  it('returns 15 minutes lockout at threshold (5)', () => {
    expect(nextLockoutEpoch(5, 1000)).toBe(1000 + 15 * 60)
  })

  it('escalates to 30 minutes at 6th fail', () => {
    expect(nextLockoutEpoch(6, 1000)).toBe(1000 + 30 * 60)
  })

  it('escalates to 60 minutes at 7th fail', () => {
    expect(nextLockoutEpoch(7, 1000)).toBe(1000 + 60 * 60)
  })

  it('caps at 60 minutes for further fails', () => {
    expect(nextLockoutEpoch(20, 1000)).toBe(1000 + 60 * 60)
  })
})

function makeDB() {
  const calls = []
  return {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => {
          calls.push({ sql, args })
          return { run: async () => ({ success: true }) }
        },
      }),
      _calls: calls,
    },
  }
}

describe('recordFailedLogin', () => {
  it('increments login_fails and stores no lockout below threshold', async () => {
    const env = makeDB()
    const result = await recordFailedLogin(env, { id: 1, login_fails: 0 }, 1000)
    expect(result.fails).toBe(1)
    expect(result.lockUntil).toBeNull()
    expect(env.DB._calls[0].args).toEqual([1, null, 1])
  })

  it('sets lockout when reaching threshold', async () => {
    const env = makeDB()
    const result = await recordFailedLogin(env, { id: 7, login_fails: 4 }, 1000)
    expect(result.fails).toBe(5)
    expect(result.lockUntil).toBe(1000 + 15 * 60)
    expect(env.DB._calls[0].args).toEqual([5, 1000 + 15 * 60, 7])
  })

  it('handles missing login_fails (treats as 0)', async () => {
    const env = makeDB()
    const result = await recordFailedLogin(env, { id: 1 }, 1000)
    expect(result.fails).toBe(1)
  })
})

describe('resetLoginFails', () => {
  it('issues UPDATE with zero/null', async () => {
    const env = makeDB()
    await resetLoginFails(env, 42)
    expect(env.DB._calls[0].sql).toMatch(/login_fails = 0, locked_until = NULL/)
    expect(env.DB._calls[0].args).toEqual([42])
  })
})
