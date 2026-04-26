// Global security headers applied to every response served by Pages Functions
// (HTML, API JSON, R2 media). CSP applies to HTML responses only in browsers,
// but adding the header to every response is harmless and consistent.

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' for styles is required by framer-motion / TipTap inline styles.
  // Scripts stay strict (no inline, no eval) — Vite production output is fully bundled.
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  // R2 media is served from the same origin via /r2/; data: + blob: cover image previews
  // (TipTap editor uses blob URLs while uploading).
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export async function onRequest(context) {
  const response = await context.next()
  const headers = new Headers(response.headers)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
