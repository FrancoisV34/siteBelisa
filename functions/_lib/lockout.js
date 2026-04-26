// Progressive account lockout helpers used by the login endpoint.
// First 5 failures: no lockout (lets a forgetful user retry).
// 5th fail and beyond: locked for 15, 30, then 60 min (capped).

const FAIL_THRESHOLD = 5
const LOCKOUT_STEPS_MINUTES = [15, 30, 60]

export function isLocked(user, nowSec) {
  return Boolean(user.locked_until && user.locked_until > nowSec)
}

export function lockoutSecondsRemaining(user, nowSec) {
  if (!isLocked(user, nowSec)) return 0
  return user.locked_until - nowSec
}

export function nextLockoutEpoch(failsAfterIncrement, nowSec) {
  if (failsAfterIncrement < FAIL_THRESHOLD) return null
  const stepIndex = Math.min(failsAfterIncrement - FAIL_THRESHOLD, LOCKOUT_STEPS_MINUTES.length - 1)
  const minutes = LOCKOUT_STEPS_MINUTES[stepIndex]
  return nowSec + minutes * 60
}

export async function recordFailedLogin(env, user, nowSec) {
  const fails = (user.login_fails || 0) + 1
  const lockUntil = nextLockoutEpoch(fails, nowSec)
  await env.DB.prepare(
    `UPDATE users SET login_fails = ?, locked_until = ? WHERE id = ?`
  ).bind(fails, lockUntil, user.id).run()
  return { fails, lockUntil }
}

export async function resetLoginFails(env, userId) {
  await env.DB.prepare(
    `UPDATE users SET login_fails = 0, locked_until = NULL WHERE id = ?`
  ).bind(userId).run()
}
