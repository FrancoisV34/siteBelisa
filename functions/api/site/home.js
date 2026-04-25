import { json, serverError } from '../../_lib/json.js'

export async function onRequestGet({ env }) {
  try {
    const settings = await env.DB.prepare(
      `SELECT key, value FROM site_settings WHERE key IN ('home.hero_title', 'home.hero_subtitle')`
    ).all()
    const map = Object.fromEntries((settings.results || []).map((r) => [r.key, r.value]))

    const sections = await env.DB.prepare(
      `SELECT id, title, body_html, image_url, position
       FROM home_sections WHERE status = 'visible'
       ORDER BY position ASC, id ASC`
    ).all()

    const stats = await env.DB.prepare(
      `SELECT id, number, label, position FROM home_stats
       ORDER BY position ASC, id ASC`
    ).all()

    return json({
      hero: {
        title: map['home.hero_title'] || '',
        subtitle: map['home.hero_subtitle'] || '',
      },
      sections: sections.results || [],
      stats: stats.results || [],
    })
  } catch (e) {
    return serverError(e.message)
  }
}
