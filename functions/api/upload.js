import { json, badRequest, serverError } from '../_lib/json.js'
import { requireUser } from '../_lib/auth.js'
import { validateImage, makeKey, publicUrl } from '../_lib/r2.js'

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireUser(request, env)
    if (auth.error) return auth.error

    const form = await request.formData().catch(() => null)
    if (!form) return badRequest('Invalid form data')
    const file = form.get('file')
    const v = validateImage(file)
    if (v.error) return badRequest(v.error)

    const key = makeKey(v.ext)
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    })

    return json({ url: publicUrl(key), key })
  } catch (e) {
    return serverError(e.message)
  }
}
