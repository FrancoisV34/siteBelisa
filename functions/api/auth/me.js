import { json } from '../../_lib/json.js'
import { getCurrentUser } from '../../_lib/auth.js'

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ user: null })
  return json({
    user: {
      id: user.id, email: user.email,
      display_name: user.display_name, role: user.role,
    },
  })
}
