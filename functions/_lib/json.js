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

export function serverError(message = 'Internal error') {
  return json({ error: message }, { status: 500 })
}
