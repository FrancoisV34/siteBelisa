import { json, serverError } from '../../_lib/json.js'

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, year, technique, dimensions, description,
              image_url, book_url, ebook_url, position
       FROM oeuvres WHERE status = 'visible'
       ORDER BY position ASC, id ASC`
    ).all()
    return json({ oeuvres: results || [] })
  } catch (e) {
    return serverError(e.message)
  }
}
