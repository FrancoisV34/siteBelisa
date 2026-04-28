export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  })
}

export function badRequest(message) {
  return json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return json({ error: message }, { status: 404 })
}

export function serverError(error) {
  // Never leak internal exception details to clients (D1/R2 errors, schema info, stack hints).
  // Log server-side only — visible via `wrangler tail` and Cloudflare Logs.
  if (error !== undefined) console.error('[serverError]', error)
  return json({ error: 'Internal error' }, { status: 500 })
}
