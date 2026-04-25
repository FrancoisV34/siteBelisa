export async function onRequestGet({ env, params }) {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path
  if (!key) return new Response('Not found', { status: 404 })
  const obj = await env.MEDIA.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  headers.set('content-type', obj.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  if (obj.httpEtag) headers.set('etag', obj.httpEtag)
  return new Response(obj.body, { headers })
}
